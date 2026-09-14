import React, { useMemo, useState } from 'react';
import { Tag, Segmented, Popconfirm } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, WifiOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Panel, Button, Toolbar } from '../components/ui';
import { useT } from '../i18n/I18nContext';
import { useNotifications } from './NotificationsContext';
import { since } from './format';

/**
 * Page dédiée aux notifications.
 *
 * Le panneau de la cloche n'en montre que cinq : au-delà, il déborde de
 * l'écran. Tout l'historique du compte est ici, avec le filtre non lus, parce
 * que c'est la question qu'on se pose en arrivant — qu'ai-je manqué ?
 */
const NotificationsPanel = () => {
  const t = useT();
  const navigate = useNavigate();
  const { items, unread, status, markAllRead, markRead, clear } = useNotifications();
  const [filter, setFilter] = useState('all');

  const shown = useMemo(
    () => (filter === 'unread' ? items.filter((n) => !n.read) : items),
    [items, filter]
  );

  // Les notifications d'un même jour se lisent ensemble ; les séparer par date
  // évite de faire calculer au lecteur ce que « il y a 26 h » veut dire.
  const groups = useMemo(() => {
    const map = new Map();
    for (const n of shown) {
      const day = new Date(n.at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(n);
    }
    return [...map.entries()];
  }, [shown]);

  const go = (n) => { markRead(n.id); if (n.target) navigate(`/${n.target}`); };

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <Toolbar>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { label: t('s.toutes'), value: 'all' },
            { label: `${t('s.non_lues')}${unread ? ` (${unread})` : ''}`, value: 'unread' },
          ]}
        />
        <span className="flex-1" />
        <span className="flex items-center gap-1.5 pr-1">
          <WifiOutlined style={{ fontSize: 11 }}
                        className={status === 'SUBSCRIBED' ? 'text-emerald-500' : 'text-text-muted'} />
          <span className="text-[0.72rem] text-text-muted">
            {status === 'SUBSCRIBED' ? t('s.connecte_en_direct') : t('s.hors_connexion_directe')}
          </span>
        </span>
        {unread > 0 && (
          <Button icon={<CheckOutlined />} onClick={markAllRead}>{t('s.tout_marquer_comme_lu')}</Button>
        )}
        {items.length > 0 && (
          <Popconfirm title={t('s.effacer_l_historique')} onConfirm={clear}
                      okText={t('s.effacer')} cancelText={t('s.annuler')}>
            <Button danger icon={<DeleteOutlined />}>{t('s.effacer')}</Button>
          </Popconfirm>
        )}
      </Toolbar>

      {shown.length === 0 ? (
        <Panel>
          <div className="py-14 text-center">
            <BellOutlined style={{ fontSize: 28 }} className="text-text-muted opacity-40" />
            <p className="mt-3 text-[0.86rem] font-medium text-text-heading">
              {filter === 'unread' ? t('s.aucune_notification_non_lue') : t('s.aucune_notification')}
            </p>
            <p className="mt-1 text-[0.78rem] text-text-muted">{t('s.les_evenements_apparaitront_ici_en_direct')}</p>
          </div>
        </Panel>
      ) : (
        groups.map(([day, list]) => (
          <Panel key={day} title={day} noPadding>
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {list.map((n) => (
                <li key={n.id}>
                  <button onClick={() => go(n)}
                          className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors ${n.read ? 'opacity-55' : ''}`}>
                    <Tag color={n.tone} bordered={false} className="mt-1 shrink-0 !mr-0 !px-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-current align-middle" />
                    </Tag>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.84rem] text-text-heading leading-snug break-words">{n.text}</span>
                      <span className="block text-[0.72rem] text-text-muted mt-0.5">{since(t, n.at)}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ))
      )}
    </div>
  );
};

export default NotificationsPanel;
