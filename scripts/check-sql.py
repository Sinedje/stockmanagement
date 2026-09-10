"""Valide la syntaxe des migrations avec l'analyseur réel de PostgreSQL."""
import glob, sys
from pglast import parse_sql
from pglast.parser import ParseError

files = sorted(glob.glob('supabase/migrations/*.sql')) + ['supabase/schema.sql',
              'supabase/bootstrap_superadmin.sql', 'supabase/verify_rls.sql']
bad = 0
for f in files:
    try:
        stmts = parse_sql(open(f, encoding='utf-8').read())
        print(f"  ✓ {f:44} {len(stmts)} instructions")
    except ParseError as e:
        bad += 1
        print(f"  ✗ {f}")
        print(f"      {e}")
print()
print('Toutes les migrations sont syntaxiquement valides.' if not bad
      else f'{bad} fichier(s) en erreur.')
sys.exit(1 if bad else 0)
