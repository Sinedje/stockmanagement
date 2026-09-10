-- ===========================================================================
--  0005 — Fonctionnalités activables et identité visuelle par entreprise
--
--  `features` est un objet JSON plutôt qu'une colonne par module : ajouter une
--  fonctionnalité ne doit pas imposer une migration de schéma. Une clé absente
--  vaut « activée », pour que les entreprises existantes ne perdent rien au
--  moment où un nouveau module apparaît.
-- ===========================================================================

alter table public.companies
  add column if not exists features jsonb not null default '{}'::jsonb,
  add column if not exists logo_url text;

comment on column public.companies.features is
  'Modules activés. Clé absente = activé. Ex : {"transfers": false}';

-- Réglages de la plateforme (une seule ligne) : valeurs par défaut appliquées
-- aux entreprises créées ensuite.
create table if not exists public.platform_settings (
  id                uuid primary key default gen_random_uuid(),
  singleton         boolean not null default true unique,  -- garantit une ligne unique
  default_features  jsonb not null default '{}'::jsonb,
  updated_at        timestamptz not null default now(),
  constraint platform_settings_single check (singleton)
);

insert into public.platform_settings (default_features)
select '{}'::jsonb
where not exists (select 1 from public.platform_settings);

alter table public.platform_settings enable row level security;

-- Seul l'exploitant y touche ; tout le monde peut lire les valeurs par défaut.
create policy platform_settings_superadmin on public.platform_settings
  for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy platform_settings_read on public.platform_settings
  for select to authenticated using (true);

create trigger platform_settings_touch before update on public.platform_settings
  for each row execute function public.touch_updated_at();
