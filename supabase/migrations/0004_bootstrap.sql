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
