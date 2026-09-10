# scripts

## check-sql.py

Valide la syntaxe des fichiers de `supabase/` avec l'analyseur réel de
PostgreSQL (`pglast`, qui embarque `libpg_query`).

Ces migrations sont exécutées à la main dans le SQL Editor : sans ce contrôle,
une erreur de syntaxe n'apparaît qu'au moment de l'exécution, à mi-parcours
d'un script qui a déjà créé la moitié des tables.

    python3 -m venv .venv && .venv/bin/pip install pglast
    .venv/bin/python scripts/check-sql.py

## migrate-to-supabase.mjs

Copie les données de MongoDB vers Supabase.

    node scripts/migrate-to-supabase.mjs              # simulation
    node scripts/migrate-to-supabase.mjs --apply      # écriture

MongoDB n'est ouvert qu'en lecture : la base actuelle reste intacte et sert de
retour arrière. Le script est réexécutable — les objets sont retrouvés par leur
identifiant naturel (nom du magasin, couple magasin + nom pour un produit) et
mis à jour plutôt que dupliqués.

Les images produit passent de la base64 vers Supabase Storage avec
`--with-images` : seau public `product-images`, chemins préfixés par
l'identifiant de l'entreprise, et `products.image_path` mis à jour.

Les comptes de connexion exigent `SUPABASE_SERVICE_ROLE_KEY` : `profiles.id`
référence `auth.users`, table que seule la clé de service peut alimenter.
Placer la clé dans `.env.local`, jamais dans un fichier suivi par git.
