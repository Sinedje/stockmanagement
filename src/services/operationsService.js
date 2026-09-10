import { requireSupabase } from '../lib/supabase';

/**
 * Opérations transverses de l'exploitant : traçabilité, activité, recherche,
 * facturation, export.
 */

/* ── Journal d'audit ────────────────────────────────────────────────────── */

/**
 * Consigne une action.
 *
 * Volontairement silencieux en cas d'échec : une trace manquante ne doit pas
 * empêcher l'opération métier de se terminer. La table étant en ajout seul,
 * une ligne écrite ne peut plus être modifiée.
 */
export const recordAudit = async ({ actor, companyId, companyName, action, target, details }) => {
  try {
    const sb = requireSupabase();
    await sb.from('audit_log').insert({
      actor_id: actor?.id,
      actor_name: actor?.name || '',
      actor_role: actor?.role || '',
      company_id: companyId || null,
      company_name: companyName || '',
      action,
      target: target || '',
      details: details || {},
    });
  } catch (err) {
    console.warn('Trace d\'audit non enregistrée :', err?.message);
  }
};

export const fetchAuditLog = async ({ companyId, limit = 200 } = {}) => {
  const sb = requireSupabase();
  let q = sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(limit);
  if (companyId) q = q.eq('company_id', companyId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};

/* ── Activité ───────────────────────────────────────────────────────────── */

export const fetchCompanyActivity = async () => {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc('company_activity');
  if (error) throw error;
  return data || [];
};

/** Horodate la connexion de l'utilisateur courant. */
export const touchLastLogin = async (userId) => {
  try {
    const sb = requireSupabase();
    await sb.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId);
  } catch { /* sans incidence sur la connexion */ }
};

/* ── Recherche globale ──────────────────────────────────────────────────── */

export const searchUsers = async (term) => {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc('search_users', { term: term || '' });
  if (error) throw error;
  return data || [];
};

/* ── Export ─────────────────────────────────────────────────────────────── */

const EXPORTABLE = [
  'stores', 'categories', 'products', 'customers', 'customer_transactions',
  'sales', 'transfers', 'stock_entries', 'expenses', 'versements',
  'cash_reports', 'breakages', 'repackagings', 'inventory_adjustments',
];

/**
 * Rassemble toutes les données d'une entreprise.
 *
 * Sert à la restitution en fin de contrat : le client doit pouvoir repartir
 * avec ses données. Les tables sont parcourues une à une plutôt qu'en une
 * requête, pour qu'une table vide ou absente n'interrompe pas l'export.
 */
export const exportCompany = async (company) => {
  const sb = requireSupabase();
  const dump = {
    exportedAt: new Date().toISOString(),
    company,
    tables: {},
  };

  for (const table of EXPORTABLE) {
    const { data, error } = await sb.from(table).select('*').eq('company_id', company.id);
    dump.tables[table] = error ? { error: error.message } : (data || []);
  }

  const { data: members } = await sb
    .from('profiles').select('id, name, username, role, is_active, store_id, last_login_at')
    .eq('company_id', company.id);
  dump.tables.members = members || [];

  return dump;
};

/** Déclenche le téléchargement d'un export au format JSON. */
export const downloadJson = (filename, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
