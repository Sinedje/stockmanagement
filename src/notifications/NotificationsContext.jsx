import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/I18nContext';
import { TABLES_BY_ROLE, describeEvent } from './rules';

const NotificationsContext = createContext(null);

const MAX = 200;   // au-delà, l'historique n'est plus consulté et pèse au chargement

/** Une clé par compte : deux personnes sur le même poste ne partagent rien. */
const keyFor = (userId) => `notifications_${userId || 'anon'}`;

export const NotificationsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const t = useT();
  const read = (userId) => {
    if (!userId) return [];
    try { return JSON.parse(localStorage.getItem(keyFor(userId)) || '[]'); }
    catch { return []; }   // stockage indisponible ou contenu abîmé
  };

  const [items, setItems] = useState(() => read(currentUser?.id));
  const [loadedFor, setLoadedFor] = useState(currentUser?.id ?? null);
  const [status, setStatus] = useState('idle');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  // L'historique appartient au compte : en changer doit changer la liste.
  // L'ajustement se fait pendant le rendu plutôt que dans un effet, pour ne pas
  // afficher un instant les notifications de la personne précédente.
  if ((currentUser?.id ?? null) !== loadedFor) {
    setLoadedFor(currentUser?.id ?? null);
    setItems(read(currentUser?.id));
  }

  useEffect(() => {
    if (!currentUser) return;
    try { localStorage.setItem(keyFor(currentUser.id), JSON.stringify(items.slice(0, MAX))); }
    catch { /* quota atteint ou navigation privée : sans conséquence */ }
  }, [items, currentUser]);

  useEffect(() => {
    if (!supabase || !currentUser) return undefined;
    const tables = TABLES_BY_ROLE[currentUser.role] || [];
    if (!tables.length) return undefined;

    const channel = supabase.channel(`notifications-${currentUser.id}`);
    for (const table of tables) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        const camelize = (r) => r && Object.fromEntries(
          Object.entries(r).map(([k, v]) => [toCamel(k), v]));

        const described = describeEvent(tRef.current, {
          table,
          event: payload.eventType,
          row: camelize(payload.new),
          old: camelize(payload.old),
        }, { currentUserId: currentUser.id });

        // Un événement qui n'apprend rien n'est pas affiché : une cloche qui
        // sonne pour rien finit par être ignorée quand elle compte vraiment.
        if (!described) return;

        setItems((prev) => [{
          id: `${table}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          table, ...described, at: new Date().toISOString(), read: false,
        }, ...prev].slice(0, MAX));
      });
    }
    channel.subscribe(setStatus);
    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const markAllRead = useCallback(() => setItems((p) => p.map((n) => ({ ...n, read: true }))), []);
  const markRead = useCallback((id) => setItems((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n))), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items,
    unread: items.filter((n) => !n.read).length,
    status,
    markAllRead, markRead, clear,
  }), [items, status, markAllRead, markRead, clear]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications doit être utilisé dans un <NotificationsProvider>');
  return ctx;
};

export default NotificationsContext;
