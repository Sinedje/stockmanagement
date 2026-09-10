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
