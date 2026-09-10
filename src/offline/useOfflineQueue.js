import { useCallback, useEffect, useRef, useState } from 'react';
import { countPendingSales, flushPendingSales } from './pendingSales';
import { createSale, createInvoiceSale } from '../services/saleService';

/**
 * Surveille la file des ventes non transmises et la rejoue.
 *
 * Trois déclencheurs : le retour de la connexion, le retour sur l'onglet — une
 * caisse reste souvent ouverte en arrière-plan — et un intervalle de secours,
 * l'évènement `online` étant peu fiable derrière un portail Wi-Fi qui répond
 * avant d'avoir réellement rétabli l'accès.
 */
export const useOfflineQueue = () => {
  const [pending, setPending] = useState(0);
  const [flushing, setFlushing] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    try { setPending(await countPendingSales()); } catch { /* IndexedDB indisponible */ }
  }, []);

  const flush = useCallback(async () => {
    // Un seul rejeu à la fois : deux passages simultanés enverraient la même
    // vente deux fois, l'entrée n'étant supprimée qu'après acquittement.
    if (busy.current || !navigator.onLine) return;
    busy.current = true;
    setFlushing(true);
    try {
      const result = await flushPendingSales({
        invoice: createInvoiceSale,
        direct: createSale,
      });
      setPending(result.remaining);
      return result;
    } catch { /* on retentera */ }
    finally { busy.current = false; setFlushing(false); }
  }, []);

  useEffect(() => {
    refresh();

    const goOnline = () => { setOnline(true); flush(); };
    const goOffline = () => setOnline(false);
    const onVisible = () => { if (!document.hidden) flush(); };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(flush, 60_000);

    flush();

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [flush, refresh]);

  return { pending, flushing, online, flush, refresh };
};

export default useOfflineQueue;
