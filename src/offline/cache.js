/**
 * Cache local des données de référence.
 *
 * Sans lui, une caisse qui démarre sans réseau affiche un catalogue vide : la
 * caissière voit l'application, mais n'a rien à vendre. Le catalogue change
 * rarement dans une journée — le conserver localement est sans risque et rend
 * l'écran de vente utilisable pendant une coupure.
 *
 * Le cache ne sert qu'en repli : dès que le serveur répond, sa réponse fait
 * autorité et remplace l'entrée. On ne fusionne rien, pour ne jamais afficher
 * un mélange de données fraîches et périmées.
 */

const DB_NAME = 'stock-expert-offline';
const STORE = 'reference-cache';
const VERSION = 2;   // la version 1 ne contenait que la file des ventes

const openDb = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains('pending-sales')) {
      db.createObjectStore('pending-sales', { keyPath: 'queueId' });
    }
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: 'key' });
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const tx = async (mode, fn) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(out?.result ?? out); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
};

/** Ce qu'il est utile de conserver : de quoi vendre, rien de plus. */
export const CACHED_KEYS = ['stores', 'products', 'categories', 'customers', 'companySettings'];

export const putCache = async (key, value) => {
  if (!CACHED_KEYS.includes(key)) return;
  try {
    await tx('readwrite', (s) => s.put({ key, value, savedAt: new Date().toISOString() }));
  } catch (err) {
    console.warn(`Cache « ${key} » non écrit :`, err?.message);
  }
};

export const getCache = async (key) => {
  try {
    const row = await tx('readonly', (s) => s.get(key));
    return row ? { value: row.value, savedAt: row.savedAt } : null;
  } catch { return null; }
};

/** Horodatage du cache le plus ancien, pour dire à l'écran de quand il date. */
export const cacheAge = async () => {
  const rows = await Promise.all(CACHED_KEYS.map(getCache));
  const dates = rows.filter(Boolean).map(r => r.savedAt).sort();
  return dates[0] || null;
};

export const clearCache = () => tx('readwrite', (s) => s.clear());
