-- ===========================================================================
--  0011 — Diffusion en temps réel des changements
--
--  Les données n'étaient chargées qu'à la connexion. Une vente encaissée au
--  comptoir n'apparaissait donc jamais sur le poste du gérant, et deux
--  caissières travaillant en parallèle voyaient chacune un stock périmé —
--  jusqu'à vendre un article que l'autre venait d'épuiser.
--
--  Les tables ci-dessous sont publiées : Supabase Realtime relaie leurs
--  changements aux clients abonnés, par WebSocket. La Row Level Security
--  s'applique à ces messages comme aux requêtes : un employé ne reçoit que ce
--  qu'il a le droit de lire, et rien des autres entreprises.
-- ===========================================================================

/* ── Réplication complète des lignes modifiées ────────────────────────────── */

-- Sans REPLICA IDENTITY FULL, une suppression ne transmet que la clé primaire.
-- Le client ne saurait pas quelle ligne retirer de son affichage quand il
-- l'identifie autrement, ni à quelle entreprise elle appartenait — la RLS ne
-- pourrait donc pas filtrer l'événement.
do $$
declare
  t text;
  tables text[] := array[
    'stores', 'categories', 'products', 'customers', 'customer_transactions',
    'sales', 'sale_items', 'sale_payments', 'transfers', 'transfer_items',
    'stock_entries', 'stock_entry_items', 'expenses', 'versements',
    'cash_reports', 'breakages', 'repackagings', 'inventory_adjustments',
    'profiles', 'companies', 'audit_log'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I replica identity full', t);

    -- `add table` échoue si la table est déjà publiée : on ne l'ajoute que si
    -- elle manque, pour que la migration puisse être rejouée sans risque.
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- La lecture du journal par le superadmin est déjà couverte par la politique
-- audit_log_superadmin_read (migration 0007) : rien à ajouter ici.
