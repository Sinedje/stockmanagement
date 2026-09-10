-- ============================================================================
--  0001 — Socle multi-entreprises
--
--  `companies` est la racine du cloisonnement : chaque table métier porte un
--  `company_id`, et l'isolation est appliquée par PostgreSQL (RLS), pas par le
--  code applicatif. Une requête qui oublierait le filtre ne peut donc pas fuiter
--  les données d'une autre entreprise.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── Rôles ───────────────────────────────────────────────────────────────────
-- `superadmin` est au-dessus des entreprises (company_id nul) : c'est
-- l'exploitant de la plateforme. Les autres rôles existent déjà dans l'app.
create type public.app_role as enum (
  'superadmin', 'ceo', 'manager', 'accountant', 'cashier', 'storekeeper'
);

create type public.company_status as enum ('active', 'suspended');

-- ── Entreprises ─────────────────────────────────────────────────────────────
-- Reprend les champs de l'ancien document unique `CompanySettings` : le profil
-- d'entreprise et le locataire ne font qu'une seule entité.
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  activity    text not null default '',
  phones      text not null default '',
  ncc         text not null default '',
  rccm        text not null default '',
  language    text not null default 'fr' check (language in ('fr', 'en')),
  status      company_status not null default 'active',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Profils ─────────────────────────────────────────────────────────────────
-- Supabase gère l'authentification dans `auth.users` ; les informations métier
-- vivent ici. `company_id` est nul uniquement pour un superadmin.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete cascade,
  name        text not null,
  username    text not null,
  role        app_role not null,
  store_id    uuid,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Un superadmin n'appartient à aucune entreprise ; tout autre rôle en exige une.
  constraint profiles_company_matches_role check (
    (role = 'superadmin' and company_id is null)
    or (role <> 'superadmin' and company_id is not null)
  )
);

-- L'identifiant n'est unique qu'à l'intérieur d'une entreprise : deux sociétés
-- peuvent chacune avoir un « admin ». La connexion se fait par e-mail (auth.users),
-- ce qui évite toute collision globale.
create unique index profiles_company_username_key
  on public.profiles (company_id, lower(username))
  where company_id is not null;

-- ── Fonctions d'aide (utilisées par les politiques RLS) ─────────────────────
-- `security definer` + search_path figé : ces fonctions lisent `profiles` sans
-- être elles-mêmes soumises aux politiques, ce qui éviterait une récursion.
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  )
$$;

create or replace function public.has_role(roles app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(roles)
  )
$$;

-- ── Horodatage automatique ──────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_touch before update on public.companies
  for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
