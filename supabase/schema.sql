-- ===========================================================================
--  Stock Expert — schéma multi-entreprises (SQL Editor)
--  0001 socle · 0002 métier · 0003 RLS · 0004 amorçage
--  0005 modules · 0006 quotas · 0007 audit / activité / facturation
-- ===========================================================================

-- ─── 0001_tenancy.sql ───────────────────────────────
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


-- ─── 0002_business.sql ───────────────────────────────
-- ============================================================================
--  0002 — Tables métier
--
--  Reprise des 16 collections MongoDB. Les tableaux imbriqués (`sale.items`,
--  `sale.paymentHistory`, `transfer.items`, `stockEntry.items`) deviennent des
--  tables filles : les montants et quantités redeviennent interrogeables en SQL.
-- ============================================================================

-- ── Magasins ────────────────────────────────────────────────────────────────
create table public.stores (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  location    text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, name)
);

alter table public.profiles
  add constraint profiles_store_fk foreign key (store_id) references public.stores(id) on delete set null;

-- ── Catégories ──────────────────────────────────────────────────────────────
-- Le nom était unique globalement ; il l'est désormais par entreprise.
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (company_id, name)
);

-- ── Produits ────────────────────────────────────────────────────────────────
-- `image_path` remplace le base64 stocké en base : le fichier vit dans
-- Supabase Storage, la table ne garde que son chemin.
create table public.products (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  store_id         uuid not null references public.stores(id) on delete cascade,
  name             text not null,
  designation      text not null default '',
  category         text not null default '',
  price            numeric(14,2) not null default 0,
  cost             numeric(14,2) not null default 0,
  stock            integer not null default 0,
  physical_stock   integer not null default 0,
  min_stock        integer not null default 0,
  image_path       text,
  supplier         text not null default '',
  delivery_note    text not null default '',
  is_non_inventory boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (store_id, name)
);
create index products_company_idx on public.products (company_id);

-- ── Clients ─────────────────────────────────────────────────────────────────
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  phone       text not null default '',
  balance     numeric(14,2) not null default 0,
  total_spent numeric(14,2) not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (company_id, name, phone)
);

create table public.customer_transactions (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  store_id    uuid references public.stores(id) on delete set null,
  type        text not null check (type in ('deposit', 'refund', 'sale')),
  amount      numeric(14,2) not null,
  method      text not null default '',
  reference   text not null,
  cashier     text not null default '',
  date        timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index customer_tx_company_idx on public.customer_transactions (company_id, customer_id);

-- ── Ventes ──────────────────────────────────────────────────────────────────
create table public.sales (
  id                      uuid primary key default gen_random_uuid(),
  company_id              uuid not null references public.companies(id) on delete cascade,
  store_id                uuid not null references public.stores(id) on delete restrict,
  customer_id             uuid references public.customers(id) on delete set null,
  invoice_number          text not null,
  date                    timestamptz not null default now(),
  total                   numeric(14,2) not null default 0,
  items_total             numeric(14,2) not null default 0,
  payment_method          text not null default '',
  cashier                 text not null default '',
  customer_name           text not null default '',
  customer_phone          text not null default '',
  amount_paid             numeric(14,2) not null default 0,
  amount_due              numeric(14,2) not null default 0,
  payment_status          text not null default 'fully_paid' check (payment_status in ('fully_paid','partial','unpaid')),
  delivery_status         text not null default 'pending'    check (delivery_status in ('pending','partially_delivered','delivered')),
  status                  text not null default 'completed'  check (status in ('completed','cancelled')),
  delivery_unlocked       boolean not null default false,
  type                    text not null default 'sale' check (type in ('sale','return','deposit','refund')),
  original_invoice_number text not null default '',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Équivalent exact de l'index partiel MongoDB : le numéro de facture n'est
-- unique que pour les ventes non annulées.
create unique index sales_invoice_unique
  on public.sales (company_id, invoice_number)
  where status = 'completed';
create index sales_store_date_idx on public.sales (company_id, store_id, date desc);

create table public.sale_items (
  id                 uuid primary key default gen_random_uuid(),
  sale_id            uuid not null references public.sales(id) on delete cascade,
  product_id         uuid references public.products(id) on delete set null,
  store_id           uuid references public.stores(id) on delete set null,
  name               text not null,
  price              numeric(14,2) not null default 0,
  quantity           integer not null default 0,
  is_delivered       boolean not null default false,
  quantity_delivered integer not null default 0
);
create index sale_items_sale_idx on public.sale_items (sale_id);

create table public.sale_payments (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales(id) on delete cascade,
  date       timestamptz not null default now(),
  amount     numeric(14,2) not null,
  method     text not null,
  cashier    text not null,
  reference  text not null default ''
);
create index sale_payments_sale_idx on public.sale_payments (sale_id);

-- ── Transferts inter-magasins ───────────────────────────────────────────────
create table public.transfers (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  reference      text not null,
  from_store_id  uuid not null references public.stores(id) on delete restrict,
  to_store_id    uuid not null references public.stores(id) on delete restrict,
  status         text not null default 'in_transit' check (status in ('in_transit','completed')),
  initiated_by   text not null,
  received_by    text,
  received_date  timestamptz,
  notes          text not null default '',
  date           timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (company_id, reference),
  constraint transfers_distinct_stores check (from_store_id <> to_store_id)
);

create table public.transfer_items (
  id          uuid primary key default gen_random_uuid(),
  transfer_id uuid not null references public.transfers(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  name        text not null,
  quantity    integer not null
);

-- ── Entrées de stock ────────────────────────────────────────────────────────
create table public.stock_entries (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete restrict,
  supplier    text not null,
  note_number text not null,
  date        timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create table public.stock_entry_items (
  id             uuid primary key default gen_random_uuid(),
  stock_entry_id uuid not null references public.stock_entries(id) on delete cascade,
  product_id     uuid references public.products(id) on delete set null,
  name           text not null,
  quantity       integer not null,
  cost           numeric(14,2) not null default 0
);

-- ── Caisse ──────────────────────────────────────────────────────────────────
create table public.expenses (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id   uuid not null references public.stores(id) on delete cascade,
  label      text not null,
  amount     numeric(14,2) not null,
  cashier    text not null,
  date       timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.versements (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  store_id   uuid not null references public.stores(id) on delete cascade,
  amount     numeric(14,2) not null,
  cashier    text not null,
  date       timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- `invoices_list` / `expenses_list` étaient des tableaux libres : ils restent en
-- JSONB, car ce sont des clichés figés au moment de la clôture.
create table public.cash_reports (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  store_id         uuid not null references public.stores(id) on delete cascade,
  cashier          text not null,
  initial_fund     numeric(14,2) not null default 0,
  cash_sales       numeric(14,2) not null default 0,
  total_expenses   numeric(14,2) not null default 0,
  total_versements numeric(14,2) not null default 0,
  final_balance    numeric(14,2) not null default 0,
  discrepancy      numeric(14,2) not null default 0,
  notes            text not null default '',
  invoice_range    text not null default '',
  invoices_list    jsonb not null default '[]'::jsonb,
  expenses_list    jsonb not null default '[]'::jsonb,
  date             timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

-- ── Casses & reconditionnement ──────────────────────────────────────────────
create table public.breakages (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  store_id     uuid not null references public.stores(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity     integer not null,
  reason       text not null,
  date         timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create table public.repackagings (
  id                 uuid primary key default gen_random_uuid(),
  company_id         uuid not null references public.companies(id) on delete cascade,
  store_id           uuid not null references public.stores(id) on delete cascade,
  broken_product_id  uuid references public.products(id) on delete set null,
  broken_product_name text not null,
  broken_qty         integer not null,
  new_product_id     uuid references public.products(id) on delete set null,
  new_product_name   text not null,
  new_product_qty    integer not null,
  date               timestamptz not null default now(),
  created_at         timestamptz not null default now()
);

-- ── Ajustements d'inventaire ────────────────────────────────────────────────
create table public.inventory_adjustments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  store_id    uuid not null references public.stores(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  user_id     uuid references public.profiles(id) on delete set null,
  user_name   text not null,
  old_stock   integer not null,
  new_stock   integer not null,
  discrepancy integer not null,
  reason      text not null default 'Inventaire physique',
  date        timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create trigger stores_touch    before update on public.stores    for each row execute function public.touch_updated_at();
create trigger products_touch  before update on public.products  for each row execute function public.touch_updated_at();
create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();
create trigger sales_touch     before update on public.sales     for each row execute function public.touch_updated_at();


-- ─── 0003_rls.sql ───────────────────────────────
-- ============================================================================
--  0003 — Row Level Security
--
--  C'est ici que se joue l'isolation. Chaque table métier n'expose que les
--  lignes de l'entreprise de l'utilisateur connecté. Une requête qui oublierait
--  `where company_id = ...` ne renvoie rien d'autre : PostgreSQL applique le
--  filtre, l'application n'a pas à y penser.
-- ============================================================================

-- ── Entreprises ─────────────────────────────────────────────────────────────
alter table public.companies enable row level security;

-- Le superadmin administre le parc ; un membre ne voit que sa propre entreprise.
create policy companies_superadmin_all on public.companies
  for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy companies_member_read on public.companies
  for select using (id = public.current_company_id());

-- Seul un dirigeant peut modifier la fiche de SON entreprise.
create policy companies_admin_update on public.companies
  for update using (id = public.current_company_id() and public.has_role(array['ceo']::app_role[]))
  with check (id = public.current_company_id());

-- ── Profils ─────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy profiles_superadmin_all on public.profiles
  for all using (public.is_superadmin()) with check (public.is_superadmin());

-- Chacun lit son propre profil (nécessaire au démarrage de la session).
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());

-- Les membres d'une entreprise se voient entre eux.
create policy profiles_company_read on public.profiles
  for select using (company_id = public.current_company_id());

-- L'admin d'entreprise gère ses propres membres — et uniquement les siens.
create policy profiles_admin_write on public.profiles
  for all
  using (company_id = public.current_company_id() and public.has_role(array['ceo']::app_role[]))
  with check (
    company_id = public.current_company_id()
    and public.has_role(array['ceo']::app_role[])
    -- Un admin d'entreprise ne peut pas fabriquer un superadmin.
    and role <> 'superadmin'
  );

-- ── Tables métier ───────────────────────────────────────────────────────────
-- Même règle partout : la ligne appartient à l'entreprise de l'utilisateur.
-- Appliquée par boucle pour qu'aucune table ne soit oubliée.
do $$
declare
  t text;
  tenant_tables text[] := array[
    'stores', 'categories', 'products', 'customers', 'customer_transactions',
    'sales', 'transfers', 'stock_entries', 'expenses', 'versements',
    'cash_reports', 'breakages', 'repackagings', 'inventory_adjustments'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table public.%I enable row level security', t);

    execute format($f$
      create policy %1$I_tenant on public.%1$I
        for all
        using (company_id = public.current_company_id())
        with check (company_id = public.current_company_id())
    $f$, t);

    -- Lecture seule pour le superadmin : il supervise le parc sans pouvoir
    -- modifier les écritures comptables d'une entreprise cliente.
    execute format($f$
      create policy %1$I_superadmin_read on public.%1$I
        for select using (public.is_superadmin())
    $f$, t);
  end loop;
end;
$$;

-- ── Tables filles ───────────────────────────────────────────────────────────
-- Elles ne portent pas de `company_id` : elles héritent de leur parent, ce qui
-- évite de dupliquer (et de désynchroniser) l'appartenance.
do $$
declare
  spec record;
begin
  for spec in
    select * from (values
      ('sale_items',        'sales',         'sale_id'),
      ('sale_payments',     'sales',         'sale_id'),
      ('transfer_items',    'transfers',     'transfer_id'),
      ('stock_entry_items', 'stock_entries', 'stock_entry_id')
    ) as s(child, parent, fk)
  loop
    execute format('alter table public.%I enable row level security', spec.child);

    execute format($f$
      create policy %1$I_via_parent on public.%1$I
        for all
        using (exists (
          select 1 from public.%2$I p
          where p.id = public.%1$I.%3$I and p.company_id = public.current_company_id()
        ))
        with check (exists (
          select 1 from public.%2$I p
          where p.id = public.%1$I.%3$I and p.company_id = public.current_company_id()
        ))
    $f$, spec.child, spec.parent, spec.fk);

    execute format($f$
      create policy %1$I_superadmin_read on public.%1$I
        for select using (public.is_superadmin())
    $f$, spec.child);
  end loop;
end;
$$;


-- ─── 0004_bootstrap.sql ───────────────────────────────
-- ===========================================================================
--  0004 — Amorçage du premier superadmin depuis l'application
--
--  Sans cela, l'initialisation obligeait à passer par le SQL Editor : la
--  politique d'écriture sur `profiles` est réservée au superadmin, qui n'existe
--  pas encore. On ouvre donc une porte unique, qui se referme d'elle-même dès
--  qu'un superadmin existe — la condition est évaluée par PostgreSQL à chaque
--  insertion, elle ne dépend pas du code client.
-- ===========================================================================

-- Indique à l'écran d'installation s'il reste quelque chose à faire.
-- Ne divulgue qu'un booléen : ni compte, ni adresse, ni entreprise.
create or replace function public.needs_bootstrap()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where role = 'superadmin')
$$;

grant execute on function public.needs_bootstrap() to anon, authenticated;

-- Une seule auto-inscription possible, et uniquement pour soi-même.
create policy profiles_bootstrap_first_superadmin on public.profiles
  for insert
  to authenticated
  with check (
    role = 'superadmin'
    and company_id is null
    -- On ne peut créer que SON propre profil : impossible d'en fabriquer un
    -- pour quelqu'un d'autre.
    and id = auth.uid()
    -- Dès qu'un superadmin existe, cette politique ne peut plus être satisfaite.
    and not exists (select 1 from public.profiles p where p.role = 'superadmin')
  );


-- ─── 0005_features.sql ───────────────────────────────
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


-- ─── 0006_limits.sql ───────────────────────────────
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
comment on column public.companies.max_users  is 'Plafond d''utilisateurs. NULL = illimité.';

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


-- ─── 0007_operations.sql ───────────────────────────────
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


