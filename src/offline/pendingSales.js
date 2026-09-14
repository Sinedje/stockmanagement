/**
 * File d'attente des ventes non transmises au serveur.
 *
 * Sans elle, une vente enregistrée pendant une coupure réseau ne vivait que
 * dans l'état React : l'application affichait « Vente enregistrée localement »
 * puis la perdait au premier rafraîchissement. Le client avait payé, et il ne
 * restait aucune trace.
 *
 * IndexedDB plutôt que localStorage : les ventes contiennent un tableau
 * d'articles, localStorage est limité à ~5 Mo et n'accepte que du texte, et
 * ses écritures bloquent le fil principal — au moment de l'encaissement, c'est
 * précisément ce qu'il faut éviter.
 *
 * On n'y conserve que ce qui est nécessaire au rejeu, et chaque entrée est
 * supprimée dès que le serveur l'a acceptée : la fenêtre d'exposition se
 * compte en minutes, pas en jours.
 */

const DB_NAME = 'stock-expert-offline';
const STORE = 'pending-sales';
const VERSION = 2;   // v2 ajoute le magasin « reference-cache »

const openDb = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: 'queueId' });
    }
    // Déclaré ici aussi : les deux modules ouvrent la même base, et seule la
    // première ouverture déclenche la mise à niveau du schéma.
    if (!db.objectStoreNames.contains('reference-cache')) {
      db.createObjectStore('reference-cache', { keyPath: 'key' });
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const tx = async (mode, fn) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(result?.result ?? result); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
};

/** Met une vente en attente. `kind` distingue les deux formes d'enregistrement. */
export const enqueueSale = async (sale, kind = 'invoice') => {
  const entry = {
    queueId: `${sale.invoiceNumber || sale.id}-${Date.now()}`,
    kind,
    sale,
    queuedAt: new Date().toISOString(),
    attempts: 0,
    lastError: '',
  };
  await tx('readwrite', (s) => s.put(entry));
  return entry.queueId;
};

const listPendingSales = () => tx('readonly', (s) => s.getAll());

export const countPendingSales = async () => {
  const rows = await listPendingSales();
  return rows.length;
};

const removePendingSale = (queueId) => tx('readwrite', (s) => s.delete(queueId));

/** Conserve la trace d'un échec, pour ne pas retenter indéfiniment en silence. */
const markAttempt = async (entry, message) => {
  await tx('readwrite', (s) => s.put({
    ...entry,
    attempts: (entry.attempts || 0) + 1,
    lastError: message || '',
    lastAttemptAt: new Date().toISOString(),
  }));
};

/**
 * Rejoue la file dans l'ordre de mise en attente.
 *
 * L'ordre importe : les numéros de facture se suivent, et un rejeu désordonné
 * rendrait un journal de caisse incohérent. On s'arrête à la première erreur
 * réseau — inutile d'insister si la connexion est absente.
 *
 * `senders` : { invoice: fn, direct: fn } — les appels réseau réels.
 */
export const flushPendingSales = async (senders) => {
  const rows = (await listPendingSales())
    .sort((a, b) => new Date(a.queuedAt) - new Date(b.queuedAt));

  let sent = 0, failed = 0;

  for (const entry of rows) {
    const send = senders[entry.kind];
    if (!send) { failed += 1; continue; }

    try {
      await send(entry.sale);
      await removePendingSale(entry.queueId);
      sent += 1;
    } catch (err) {
      await markAttempt(entry, err?.message);
      failed += 1;
      // Réseau indisponible : les suivantes échoueraient aussi.
      if (!navigator.onLine || /network|fetch|timeout/i.test(err?.message || '')) break;
    }
  }

  return { sent, failed, remaining: await countPendingSales() };
};
