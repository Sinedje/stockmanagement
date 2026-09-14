/**
 * supabaseData.js
 * Lectures métier sur Supabase, pour les comptes authentifiés par Supabase.
 *
 * L'API Express signe ses jetons avec son propre JWT_SECRET : un jeton Supabase
 * lui est étranger et toutes ses routes répondent 401. Un compte migré pouvait
 * donc se connecter sans jamais voir une seule ligne. Ces fonctions prennent le
 * relais lorsqu'une session Supabase est ouverte.
 *
 * Aucun filtre `company_id` ici : la Row Level Security s'en charge côté
 * PostgreSQL. Le rajouter ne sécuriserait rien et masquerait une politique
 * absente le jour où il en manquerait une.
 */
import { supabase } from '../lib/supabase';

const BUCKET = 'product-images';

/** Vraie si une session Supabase est ouverte — l'app doit alors lire ici. */
export const hasSupabaseSession = async () => {
  if (!supabase) return false;
  const { data: { session } } = await supabase.auth.getSession();
  return Boolean(session);
};

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

/** `physical_stock` → `physicalStock`, sur toute la ligne. */
const camelize = (row) =>
  Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]));

/**
 * PostgREST plafonne une réponse à 1000 lignes. Sans pagination, un catalogue
 * qui dépasse ce seuil serait tronqué en silence — le pire des défauts, parce
 * qu'il ressemble à des données correctes.
 */
const selectAll = async (table, columns = '*', tweak = (q) => q) => {
  const rows = [];
  const SIZE = 1000;
  for (let from = 0; ; from += SIZE) {
    let q = supabase.from(table).select(columns).range(from, from + SIZE - 1);
    const { data, error } = await tweak(q);
    if (error) throw new Error(`${table} : ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < SIZE) return rows;
  }
};

const list = async (table, tweak) => (await selectAll(table, '*', tweak)).map(camelize);

/* ── Magasins, catalogue, équipe ─────────────────────────────────────────── */

export const fetchStores = () => list('stores');

/** Les catégories voyagent en objets côté Mongo ; l'app n'en lit que le nom. */
export const fetchCategories = () => list('categories');

export const fetchProducts = async (storeId) => {
  const rows = await list('products', (q) => (storeId ? q.eq('store_id', storeId) : q));
  return rows.map(({ imagePath, ...p }) => ({
    ...p,
    // L'app affiche `image` dans un <img src>. La migration a déposé les
    // fichiers dans Storage et n'a gardé que leur chemin.
    image: imagePath ? supabase.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl : '',
  }));
};

/** Les comptes vivent dans `profiles` ; l'app les appelle « utilisateurs ». */
export const fetchUsers = async () => {
  const rows = await list('profiles');
  return rows.map((p) => ({ ...p, isActive: p.isActive !== false }));
};

/* ── Ventes ──────────────────────────────────────────────────────────────── */

/**
 * Une vente porte ses lignes et ses règlements. Les charger en trois requêtes
 * puis recomposer coûte moins qu'une jointure imbriquée par vente.
 */
export const fetchSales = async () => {
  const sales = await list('sales');
  if (!sales.length) return [];
  const [items, payments] = await Promise.all([list('sale_items'), list('sale_payments')]);
  const by = (rows, key) => rows.reduce((m, r) => ((m[r[key]] ||= []).push(r), m), {});
  const itemsBySale = by(items, 'saleId');
  const paymentsBySale = by(payments, 'saleId');
  return sales.map((s) => ({
    ...s,
    items: itemsBySale[s.id] || [],
    payments: paymentsBySale[s.id] || [],
  }));
};

/* ── Clients ─────────────────────────────────────────────────────────────── */

export const fetchCustomers = () => list('customers');
export const fetchCustomerTransactions = () => list('customer_transactions');

/* ── Mouvements de stock ─────────────────────────────────────────────────── */

const withLines = async (parentTable, lineTable, fk) => {
  const parents = await list(parentTable);
  if (!parents.length) return [];
  const lines = await list(lineTable);
  const byParent = lines.reduce((m, l) => ((m[l[fk]] ||= []).push(l), m), {});
  return parents.map((p) => ({ ...p, items: byParent[p.id] || [] }));
};

export const fetchTransfers = () => withLines('transfers', 'transfer_items', 'transferId');
export const fetchStockEntries = () => withLines('stock_entries', 'stock_entry_items', 'stockEntryId');

export const fetchBreakages = () => list('breakages');
export const fetchRepackagings = () => list('repackagings');

/* ── Caisse et comptabilité ──────────────────────────────────────────────── */

export const fetchExpenses = () => list('expenses');
export const fetchVersements = () => list('versements');
export const fetchCashReports = () => list('cash_reports');

/* ── Paramètres ──────────────────────────────────────────────────────────── */

/**
 * L'app attend l'objet de réglages d'entreprise ; côté Supabase ces champs
 * vivent sur la ligne `companies`, que la RLS restreint déjà à la sienne.
 */
export const fetchCompanySettings = async () => {
  const { data, error } = await supabase.from('companies').select('*').limit(1).maybeSingle();
  if (error) throw new Error(`companies : ${error.message}`);
  return data ? camelize(data) : null;
};
