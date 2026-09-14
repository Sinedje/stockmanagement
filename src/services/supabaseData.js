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

/* ═══ Écritures ══════════════════════════════════════════════════════════════
 *
 * Les tables métier exigent `company_id` : la RLS vérifie qu'il correspond à
 * celui de l'appelant, mais ne le renseigne pas. Il est résolu une fois puis
 * conservé — il ne change pas au cours d'une session.
 */

let cachedCompanyId;

export const currentCompanyId = async () => {
  if (cachedCompanyId !== undefined) return cachedCompanyId;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return (cachedCompanyId = null);
  const { data } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
  return (cachedCompanyId = data?.company_id ?? null);
};

/** À la déconnexion : l'entreprise du suivant n'est pas celle du précédent. */
export const forgetCompany = () => { cachedCompanyId = undefined; };

const toSnake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

/**
 * `physicalStock` → `physical_stock`, en écartant les champs que l'application
 * transporte sans qu'ils existent en base (`items`, `image`, `id`…).
 */
const snakeize = (obj, drop = []) =>
  Object.fromEntries(
    Object.entries(obj)
      .filter(([k, v]) => v !== undefined && !drop.includes(k))
      .map(([k, v]) => [toSnake(k), v])
  );

const insertRow = async (table, row, { withCompany = true, drop = [] } = {}) => {
  const payload = snakeize(row, ['id', '_id', ...drop]);
  if (withCompany) payload.company_id = await currentCompanyId();
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw new Error(error.message);
  return camelize(data);
};

const updateRow = async (table, id, patch, { drop = [] } = {}) => {
  const { data, error } = await supabase
    .from(table).update(snakeize(patch, ['id', '_id', 'companyId', ...drop])).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return camelize(data);
};

const deleteRow = async (table, id) => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { id };
};

/* ── Catalogue ───────────────────────────────────────────────────────────── */

export const createProduct = (p) => insertRow('products', p, { drop: ['image'] });
export const updateProduct = (id, p) => updateRow('products', id, p, { drop: ['image'] });
export const deleteProduct = (id) => deleteRow('products', id);

/** Import en lot : une seule requête, sinon 300 articles font 300 allers-retours. */
export const importProducts = async (rows) => {
  const companyId = await currentCompanyId();
  const payload = rows.map((p) => ({ ...snakeize(p, ['id', '_id', 'image']), company_id: companyId }));
  const { data, error } = await supabase
    .from('products').upsert(payload, { onConflict: 'store_id,name' }).select();
  if (error) throw new Error(error.message);
  return (data || []).map(camelize);
};

export const createCategory = (c) =>
  insertRow('categories', typeof c === 'string' ? { name: c } : c);
export const deleteCategory = (id) => deleteRow('categories', id);

/* ── Magasins ────────────────────────────────────────────────────────────── */

export const createStore = (s) => insertRow('stores', s);
export const updateStore = (id, s) => updateRow('stores', id, s);
export const deleteStore = (id) => deleteRow('stores', id);

/* ── Équipe ──────────────────────────────────────────────────────────────── */

/** Le compte Auth ne bouge pas ici : seul le profil est modifiable sans la clé service. */
export const updateUser = (id, patch) =>
  updateRow('profiles', id, patch, { drop: ['password', 'email', 'username'] });

export const toggleUserStatus = async (id) => {
  const { data: cur } = await supabase.from('profiles').select('is_active').eq('id', id).single();
  return updateRow('profiles', id, { isActive: !cur?.is_active });
};

/* ── Clients ─────────────────────────────────────────────────────────────── */

export const createCustomer = (c) => insertRow('customers', c);
export const createCustomerTransaction = (tx) => insertRow('customer_transactions', tx);

/* ── Caisse ──────────────────────────────────────────────────────────────── */

export const createExpense = (e) => insertRow('expenses', e);
export const createVersement = (v) => insertRow('versements', v);
export const createCashReport = (r) => insertRow('cash_reports', r);
export const updateCashReport = (id, r) => updateRow('cash_reports', id, r);

/* ── Casses et reconditionnement ─────────────────────────────────────────── */

export const createBreakage = (b) => insertRow('breakages', b);
export const createRepackaging = (r) => insertRow('repackagings', r);

/* ── Paramètres d'entreprise ─────────────────────────────────────────────── */

export const updateCompanySettings = async (patch) => {
  const companyId = await currentCompanyId();
  // `language` est une préférence individuelle depuis 0008 : elle n'a rien à
  // faire dans la fiche entreprise, où elle écraserait le choix de chacun.
  return updateRow('companies', companyId, patch, { drop: ['language', 'slug', 'status'] });
};

/* ═══ Opérations composées ═══════════════════════════════════════════════════
 *
 * Vente, entrée de stock et transfert touchent plusieurs tables et le stock.
 * Enchaînées depuis le navigateur, elles ne sont pas atomiques : une coupure
 * réseau laisse une vente sans lignes, ou un stock décrémenté pour une vente
 * qui n'existe pas. Elles passent donc par les fonctions de la migration 0010,
 * où tout passe ou rien.
 */

const rpc = async (fn, args) => {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
};

/** Les lignes imbriquées passent en snake_case comme le reste de la charge. */
const snakeDeep = (v) =>
  Array.isArray(v) ? v.map(snakeDeep)
  : v && typeof v === 'object' && !(v instanceof Date)
    ? Object.fromEntries(Object.entries(v)
        .filter(([, x]) => x !== undefined)
        .map(([k, x]) => [toSnake(k), snakeDeep(x)]))
  : v;

export const createSale = async (sale) => {
  const id = await rpc('create_sale', { p_sale: snakeDeep(sale) });
  return { ...sale, id };
};

export const cancelSale = (saleId) => rpc('cancel_sale', { p_sale_id: saleId });

export const recordPayment = (saleId, { amount, method, cashier, reference }) =>
  rpc('record_payment', {
    p_sale_id: saleId, p_amount: amount, p_method: method || 'cash',
    p_cashier: cashier || '', p_reference: reference || '',
  });

export const createStockEntry = async (entry) => {
  const id = await rpc('create_stock_entry', { p_entry: snakeDeep(entry) });
  return { ...entry, id };
};

export const createTransfer = async (transfer) => {
  const id = await rpc('create_transfer', { p_transfer: snakeDeep(transfer) });
  return { ...transfer, id };
};

export const receiveTransfer = (transferId, receivedBy) =>
  rpc('receive_transfer', { p_transfer_id: transferId, p_received_by: receivedBy || '' });
