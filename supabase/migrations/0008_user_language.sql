-- ===========================================================================
--  0008 — Langue par utilisateur
--
--  La langue n'existait que sur l'entreprise. Le superadmin n'appartenant à
--  aucune, il ne pouvait ni choisir la sienne ni la conserver.
--
--  La préférence individuelle prime désormais sur celle de l'entreprise :
--  une société peut travailler en français et embaucher un comptable
--  anglophone. NULL signifie « suivre l'entreprise », ce qui reste le
--  comportement par défaut.
-- ===========================================================================

alter table public.profiles
  add column if not exists language text
    check (language is null or language in ('fr', 'en'));

comment on column public.profiles.language is
  'Préférence individuelle. NULL = suivre la langue de l''entreprise.';
