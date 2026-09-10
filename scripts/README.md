# scripts

## check-sql.py

Valide la syntaxe des fichiers de `supabase/` avec l'analyseur réel de
PostgreSQL (`pglast`, qui embarque `libpg_query`).

Ces migrations sont exécutées à la main dans le SQL Editor : sans ce contrôle,
une erreur de syntaxe n'apparaît qu'au moment de l'exécution, à mi-parcours
d'un script qui a déjà créé la moitié des tables.

    python3 -m venv .venv && .venv/bin/pip install pglast
    .venv/bin/python scripts/check-sql.py
