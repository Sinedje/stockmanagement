-- ===========================================================================
--  0007 — Journal d'audit, activité, recherche globale, facturation
-- ===========================================================================

-- ── Journal d'audit ─────────────────────────────────────────────────────────
-- Registre en ajout seul. Aucune politique de modification ni de suppression
-- n'est définie, pas même pour le superadmin : un journal que l'on peut
-- réécrire ne prouve rien. Le nom de l'entreprise est copié dans la ligne pour
-- que la trace survive à la suppression de celle-ci.
create table public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles(id) on delete set null,
  actor_name   text not null default '',
  actor_role   text not null default '',
  company_id   uuid references public.companies(id) on delete set null,
  company_name text not null default '',
  action       text not null,
  target       text not null default '',
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index audit_log_created_idx on public.audit_log (created_at desc);
create index audit_log_company_idx on public.audit_log (company_id, created_at desc);

alter table public.audit_log enable row level security;

-- Lecture : le superadmin voit tout ; une entreprise voit ce qui la concerne,
-- afin qu'une intervention de l'exploitant lui soit opposable.
create policy audit_log_superadmin_read on public.audit_log
  for select using (public.is_superadmin());

create policy audit_log_company_read on public.audit_log
  for select using (company_id = public.current_company_id());

-- Écriture : tout utilisateur authentifié peut ajouter une trace, et
-- uniquement en son propre nom. Personne ne peut modifier ni supprimer.
create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (actor_id = auth.uid());

-- ── Activité ────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists last_login_at timestamptz;

-- Chacun peut horodater sa propre connexion ; la politique d'écriture des
-- profils s'en charge déjà (profiles_self_read couvre la lecture).
create policy profiles_self_touch_login on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ── Facturation ─────────────────────────────────────────────────────────────
create type public.billing_status as enum ('trial', 'active', 'overdue', 'cancelled');

alter table public.companies
  add column if not exists plan            text not null default 'standard',
  add column if not exists billing_status  billing_status not null default 'trial',
  add column if not exists renewal_date    date,
  add column if not exists monthly_amount  numeric(12,2);

-- ── Recherche globale d'utilisateurs ────────────────────────────────────────
-- Un appel d'assistance commence par « je suis Jean, je n'arrive plus à me
-- connecter » : il faut retrouver la personne sans connaître son entreprise.
-- L'adresse vit dans auth.users, hors de portée du client : cette fonction en
-- `security definer` fait la jointure, et refuse tout appelant non superadmin.
create or replace function public.search_users(term text)
returns table (
  id uuid, name text, username text, email text, role text,
  is_active boolean, last_login_at timestamptz,
  company_id uuid, company_name text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Réservé au superadmin' using errcode = 'insufficient_privilege';
  end if;

  return query
  select p.id, p.name, p.username, u.email::text, p.role::text,
         p.is_active, p.last_login_at,
         p.company_id, coalesce(c.name, '')
  from public.profiles p
  left join auth.users u on u.id = p.id
  left join public.companies c on c.id = p.company_id
  where term is null or term = ''
     or p.name     ilike '%' || term || '%'
     or p.username ilike '%' || term || '%'
     or u.email    ilike '%' || term || '%'
     or c.name     ilike '%' || term || '%'
  order by p.created_at desc
  limit 50;
end;
$$;

grant execute on function public.search_users(text) to authenticated;

-- ── Activité agrégée par entreprise ─────────────────────────────────────────
create or replace function public.company_activity()
returns table (
  company_id uuid, users_total bigint, users_active_30d bigint,
  stores_total bigint, sales_30d bigint, revenue_30d numeric,
  last_login_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Réservé au superadmin' using errcode = 'insufficient_privilege';
  end if;

  return query
  select c.id,
         (select count(*) from public.profiles p where p.company_id = c.id),
         (select count(*) from public.profiles p
           where p.company_id = c.id and p.last_login_at > now() - interval '30 days'),
         (select count(*) from public.stores s where s.company_id = c.id),
         (select count(*) from public.sales sa
           where sa.company_id = c.id and sa.date > now() - interval '30 days'
             and sa.status = 'completed'),
         (select coalesce(sum(sa.total), 0) from public.sales sa
           where sa.company_id = c.id and sa.date > now() - interval '30 days'
             and sa.status = 'completed'),
         (select max(p.last_login_at) from public.profiles p where p.company_id = c.id)
  from public.companies c;
end;
$$;

grant execute on function public.company_activity() to authenticated;
