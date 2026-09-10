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
