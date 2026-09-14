import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Popover, Tag, Tooltip } from 'antd';
import {
  BankOutlined, BellOutlined, CheckOutlined, FileTextOutlined,
  TeamOutlined, WifiOutlined,
} from '@ant-design/icons';
import { useT } from '../../i18n/I18nContext';
import { subscribeToPlatform } from '../../services/realtime';

const STORE_KEY = 'superadmin_notifications';
const MAX = 40;   // au-delà, le panneau devient illisible et la place inutile

/** Libellé d'un événement, dans la langue courante. */
const describe = (t, n) => {
  if (n.table === 'companies') {
    if (n.event === 'INSERT') return { icon: BankOutlined, tone: 'green', text: t('s.entreprise_creee_name', { name: n.label }) };
    if (n.event === 'DELETE') return { icon: BankOutlined, tone: 'red', text: t('s.entreprise_supprimee_name', { name: n.label }) };
    return { icon: BankOutlined, tone: 'blue', text: t('s.entreprise_modifiee_name', { name: n.label }) };
  }
  if (n.table === 'profiles') {
    if (n.event === 'INSERT') return { icon: TeamOutlined, tone: 'green', text: t('s.nouveau_compte_name', { name: n.label }) };
    if (n.event === 'DELETE') return { icon: TeamOutlined, tone: 'red', text: t('s.compte_supprime_name', { name: n.label }) };
    return { icon: TeamOutlined, tone: 'blue', text: t('s.compte_modifie_name', { name: n.label }) };
  }
  return { icon: FileTextOutlined, tone: 'default', text: n.label };
};

/** « il y a 3 min » plutôt qu'un horodatage : le panneau se lit d'un coup d'œil. */
const since = (t, iso) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return t('s.a_l_instant');
  if (s < 3600) return t('s.il_y_a_n_min', { n: Math.floor(s / 60) });
  if (s < 86400) return t('s.il_y_a_n_h', { n: Math.floor(s / 3600) });
  return t('s.il_y_a_n_j', { n: Math.floor(s / 86400) });
};

/**
 * Centre de notifications de l'exploitant.
 *
 * Les événements arrivent par WebSocket : création d'entreprise, mouvement de
 * compte, action sensible journalisée. Ils sont conservés dans le navigateur
 * pour survivre à un rechargement — le superadmin ne perd pas ce qui s'est
 * passé pendant qu'il avait la page fermée depuis sa dernière visite.
 */
const NotificationCenter = () => {
  const t = useT();
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); }
    catch { return []; }   // stockage indisponible ou contenu abîmé
  });
  const [status, setStatus] = useState('idle');
  const [open, setOpen] = useState(false);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(items.slice(0, MAX))); }
    catch { /* quota atteint ou navigation privée : sans conséquence */ }
  }, [items]);

  const push = useCallback((entry) => {
    setItems((prev) => [entry, ...prev].slice(0, MAX));
  }, []);

  useEffect(() => {
    const stop = subscribeToPlatform({
      onStatus: setStatus,
      onEvent: ({ table, event, row, old }) => {
        const src = row || old || {};
        // Le journal d'audit décrit déjà l'action : on reprend son libellé.
        const label = table === 'audit_log'
          ? `${src.action || ''} ${src.companyName ? `— ${src.companyName}` : ''}`.trim()
          : src.name || src.username || '—';
        push({
          id: `${table}-${src.id || Math.random()}-${Date.now()}`,
          table, event, label,
          at: src.createdAt || new Date().toISOString(),
          read: false,
        });
      },
    });
    return stop;
  }, [push]);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);
  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const content = (
    <div className="w-[min(92vw,22rem)]">
      <div className="flex items-center justify-between gap-3 px-1 pb-2 mb-1 border-b border-black/5 dark:border-white/10">
        <span className="text-[0.82rem] font-semibold text-text-heading">{t('s.notifications')}</span>
        {unread > 0 && (
          <button onClick={markAllRead}
                  className="text-[0.72rem] text-primary hover:underline flex items-center gap-1">
            <CheckOutlined style={{ fontSize: 11 }} /> {t('s.tout_marquer_comme_lu')}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-[0.78rem] text-text-muted">{t('s.aucune_notification')}</p>
      ) : (
        <ul className="max-h-[22rem] overflow-y-auto divide-y divide-black/5 dark:divide-white/10 -mx-1">
          {items.map((n) => {
            const { icon: Icon, tone, text } = describe(t, n);
            return (
              <li key={n.id}
                  className={`flex items-start gap-2.5 px-2 py-2.5 ${n.read ? 'opacity-55' : ''}`}>
                <Tag color={tone} bordered={false} className="mt-0.5 shrink-0">
                  <Icon style={{ fontSize: 12 }} />
                </Tag>
                <div className="min-w-0 flex-1">
                  <div className="text-[0.79rem] text-text-heading leading-snug break-words">{text}</div>
                  <div className="text-[0.7rem] text-text-muted">{since(t, n.at)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pt-2 mt-1 border-t border-black/5 dark:border-white/10 flex items-center gap-1.5">
        <WifiOutlined style={{ fontSize: 11 }}
                      className={status === 'SUBSCRIBED' ? 'text-emerald-500' : 'text-text-muted'} />
        <span className="text-[0.7rem] text-text-muted">
          {status === 'SUBSCRIBED' ? t('s.connecte_en_direct') : t('s.hors_connexion_directe')}
        </span>
      </div>
    </div>
  );

  return (
    <Popover content={content} trigger="click" placement="bottomRight"
             open={open} onOpenChange={setOpen}>
      <Tooltip title={t('s.notifications')} placement="bottom">
        <button
          className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:text-primary transition-colors border border-black/5 dark:border-white/5"
          aria-label={t('s.notifications')}
        >
          <Badge count={unread} size="small" offset={[2, -2]}>
            <BellOutlined style={{ fontSize: 16 }} />
          </Badge>
        </button>
      </Tooltip>
    </Popover>
  );
};

export default NotificationCenter;
