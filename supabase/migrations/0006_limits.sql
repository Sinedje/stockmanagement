-- ===========================================================================
--  0006 — Quotas et notes internes
--
--  Le superadmin fixe des plafonds par entreprise. Ils sont appliqués par des
--  déclencheurs côté base, et non par l'interface : un client ne doit pas
--  pouvoir dépasser son quota en appelant l'API directement.
-- ===========================================================================

alter table public.companies
  add column if not exists max_stores integer,
  add column if not exists max_users  integer,
  add column if not exists notes      text not null default '';

comment on column public.companies.max_stores is 'Plafond de magasins. NULL = illimité.';
comment on column public.companies.max_users  is "Plafond d'utilisateurs. NULL = illimité.";

-- Refus d'un magasin au-delà du quota.
create or replace function public.enforce_store_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  limit_value integer;
  current_count integer;
begin
  select max_stores into limit_value from public.companies where id = new.company_id;
  if limit_value is null then return new; end if;

  select count(*) into current_count from public.stores where company_id = new.company_id;
  if current_count >= limit_value then
    raise exception 'Quota de magasins atteint (% sur %).', current_count, limit_value
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger stores_quota before insert on public.stores
  for each row execute function public.enforce_store_quota();

-- Même principe pour les comptes utilisateurs.
create or replace function public.enforce_user_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  limit_value integer;
  current_count integer;
begin
  if new.company_id is null then return new; end if;

  select max_users into limit_value from public.companies where id = new.company_id;
  if limit_value is null then return new; end if;

  select count(*) into current_count from public.profiles where company_id = new.company_id;
  if current_count >= limit_value then
    raise exception 'Quota d''utilisateurs atteint (% sur %).', current_count, limit_value
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profiles_quota before insert on public.profiles
  for each row execute function public.enforce_user_quota();
