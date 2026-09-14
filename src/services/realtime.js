/**
 * realtime.js
 * Abonnement aux changements de la base, par WebSocket.
 *
 * Les données n'étaient chargées qu'à la connexion : une vente encaissée au
 * comptoir n'apparaissait jamais sur le poste du gérant, et deux caissières
 * voyaient chacune un stock périmé. Supabase relaie ici les changements des
 * tables publiées (migration 0011), filtrés par la Row Level Security — un
 * poste ne reçoit que ce que son utilisateur a le droit de lire.
 */
import { supabase } from '../lib/supabase';

/** Tables dont une ligne suffit à mettre l'affichage à jour. */
const FLAT_TABLES = [
  'stores', 'categories', 'products', 'customers', 'customer_transactions',
  'expenses', 'versements', 'cash_reports', 'breakages', 'repackagings',
  'profiles',
];

/**
 * Tables dont une ligne ne se comprend qu'avec ses filles : une vente sans ses
 * articles n'a pas de sens. Un changement y déclenche un rechargement groupé
 * plutôt qu'une reconstruction à la main, que la moindre erreur rendrait fausse.
 */
const COMPOSED_TABLES = {
  sales: 'sales', sale_items: 'sales', sale_payments: 'sales',
  transfers: 'transfers', transfer_items: 'transfers',
  stock_entries: 'stockEntries', stock_entry_items: 'stockEntries',
};

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const camelize = (row) =>
  row && Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]));

/**
 * Ouvre un canal sur toutes les tables suivies.
 *
 * `onRow` reçoit chaque changement d'une table plate, `onComposed` le nom de la
 * ressource à recharger. Renvoie la fonction de fermeture : l'appelant doit
 * l'invoquer, sinon le canal survit au démontage et les événements s'empilent.
 */
export const subscribeToChanges = ({ onRow, onComposed, onStatus }) => {
  if (!supabase) return () => {};

  const channel = supabase.channel('stock-expert-changes');

  for (const table of FLAT_TABLES) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      onRow?.({
        table,
        event: payload.eventType,                 // INSERT | UPDATE | DELETE
        row: camelize(payload.new) || null,
        old: camelize(payload.old) || null,
      });
    });
  }

  for (const table of Object.keys(COMPOSED_TABLES)) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      onComposed?.(COMPOSED_TABLES[table]);
    });
  }

  channel.subscribe((status) => onStatus?.(status));
  return () => { supabase.removeChannel(channel); };
};

