-- ===========================================================================
--  Vérification : la RLS est-elle réellement active sur toutes les tables ?
--
--  À exécuter APRÈS schema.sql. L'analyseur du SQL Editor ne voit pas les
--  instructions générées dans un bloc DO ; cette requête interroge le
--  catalogue de PostgreSQL, qui fait foi.
--
--  Attendu : 20 lignes, toutes en « RLS active », chacune avec ≥ 1 politique.
-- ===========================================================================
select
  c.relname                                as table_name,
  case when c.relrowsecurity then 'RLS active' else '⚠ RLS DÉSACTIVÉE' end as rls,
  count(p.polname)                         as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relrowsecurity, c.relname;

-- Doit renvoyer 0 ligne : toute table listée ici serait exposée.
select c.relname as table_sans_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
