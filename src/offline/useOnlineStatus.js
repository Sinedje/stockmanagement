import { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';

/**
 * Le serveur est-il joignable ?
 *
 * Deux signaux, car aucun ne suffit seul :
 *  - `navigator.onLine` détecte le câble débranché, mais reste vrai derrière un
 *    portail Wi-Fi qui répond avant d'avoir rétabli l'accès ;
 *  - `usingCachedData` traduit un fait constaté : le dernier chargement s'est
 *    appuyé sur le cache, donc le serveur n'a pas répondu.
 */
export const useOnlineStatus = () => {
  const { usingCachedData } = useStore();
  const [navOnline, setNavOnline] = useState(navigator.onLine);

  useEffect(() => {
    const up = () => setNavOnline(true);
    const down = () => setNavOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  return { online: navOnline && !usingCachedData, navOnline, usingCachedData };
};

export default useOnlineStatus;
