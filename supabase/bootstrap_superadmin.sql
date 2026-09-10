-- ===========================================================================
--  Création du premier superadmin
--
--  Problème d'amorçage : la politique RLS n'autorise l'écriture dans
--  `profiles` qu'à un superadmin… qui n'existe pas encore. Le SQL Editor de
--  Supabase s'exécute avec des privilèges élevés et contourne la RLS : c'est
--  précisément le seul endroit d'où cette première ligne peut être créée.
--
--  Marche à suivre :
--   1. Dashboard → Authentication → Users → « Add user »
--      e-mail + mot de passe, et cocher « Auto Confirm User ».
--   2. Remplacer l'adresse ci-dessous par celle du compte créé.
--   3. Exécuter ce script.
-- ===========================================================================

do $$
declare
  target_email text := 'REMPLACER@PAR-VOTRE-EMAIL.com';  -- ← à modifier
  uid uuid;
begin
  select id into uid from auth.users where email = lower(target_email);

  if uid is null then
    raise exception
      'Aucun compte pour %. Créez-le d''abord dans Authentication → Users.', target_email;
  end if;

  insert into public.profiles (id, company_id, name, username, role)
  values (uid, null, 'Super administrateur', 'superadmin', 'superadmin')
  on conflict (id) do update
    set role = 'superadmin', company_id = null;

  raise notice 'Superadmin configuré pour % (%).', target_email, uid;
end;
$$;

-- Vérification
select p.role, p.name, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'superadmin';
