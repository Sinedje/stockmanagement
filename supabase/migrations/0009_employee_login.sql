-- ===========================================================================
--  0009 — Connexion des employés par entreprise
--
--  Les employés d'un commerce n'ont pas d'adresse e-mail professionnelle. Ils
--  se connectent depuis le lien de leur entreprise (/feu-flamenco) avec leur
--  seul nom d'utilisateur ; l'application compose en interne l'adresse
--  « pseudo@slug.local » attendue par Supabase Auth, celle-là même que la
--  migration depuis MongoDB avait déjà fabriquée.
--
--  Deux conditions à cela : qu'un pseudo désigne une seule personne dans son
--  entreprise, et qu'une page de connexion publique puisse afficher le nom de
--  l'entreprise avant toute authentification.
-- ===========================================================================

/* ── Un pseudo, une personne, dans chaque entreprise ──────────────────────── */

-- Sans cette contrainte, deux « lucie » chez le même client produiraient deux
-- adresses identiques : la seconde inscription échouerait bien plus tard, avec
-- un message incompréhensible.
create unique index if not exists profiles_company_username_key
  on public.profiles (company_id, lower(username))
  where company_id is not null;

comment on index public.profiles_company_username_key is
  'Le nom d''utilisateur sert d''identifiant de connexion : unique par entreprise, insensible à la casse.';

/* ── Résolution publique du lien d'entreprise ─────────────────────────────── */

-- La RLS masque `companies` à un visiteur non authentifié, ce qui est correct :
-- la page de connexion a pourtant besoin d'afficher « FEU FLAMENCO » avant que
-- quiconque soit connecté. Cette fonction expose le strict nécessaire — nom et
-- identifiant d'URL — et rien d'autre de la fiche entreprise.
--
-- Elle permet de vérifier qu'un slug existe ; c'est assumé, au même titre qu'un
-- sous-domaine public. Aucune donnée métier, aucun compte n'est révélé.
create or replace function public.company_by_slug(p_slug text)
returns table (id uuid, name text, slug text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.name, c.slug
  from public.companies c
  where lower(c.slug) = lower(trim(p_slug))
    and c.status = 'active'
  limit 1
$$;

revoke all on function public.company_by_slug(text) from public;
grant execute on function public.company_by_slug(text) to anon, authenticated;

comment on function public.company_by_slug(text) is
  'Nom d''une entreprise active depuis son lien, pour la page de connexion. Aucune donnée métier.';
