import React, { useMemo, useState } from 'react';
import { Tag, Popconfirm } from 'antd';
import {
  BellOutlined, CheckOutlined, DeleteOutlined, InboxOutlined,
  ThunderboltOutlined, WifiOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Panel, Button, Table, Toolbar, SearchInput, Select, StatsCard } from '../components/ui';
import { useT } from '../i18n/I18nContext';
import { useNotifications } from './NotificationsContext';
import { since } from './format';

/**
 * Historique des notifications du compte.
 *
 * Bâti comme les autres écrans — bandeau d'indicateurs, barre d'outils,
 * tableau paginé — plutôt qu'en liste à part : c'est une page du tableau de
 * bord, elle doit s'ouvrir avec le même menu et se lire de la même façon.
 */
const NotificationsPanel = () => {
  const t = useT();
  const navigate = useNavigate();
  const { items, unread, status, markAllRead, markRead, clear } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items
      .filter((n) => (filter === 'unread' ? !n.read : true))
      .filter((n) => (term ? (n.text || '').toLowerCase().includes(term) : true));
  }, [items, filter, search]);

  const today = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return items.filter((n) => new Date(n.at) >= start).length;
  }, [items]);

  const open = (n) => { markRead(n.id); if (n.target) navigate(`/${n.target}`); };

  const columns = [
    {
      key: 'text', title: t('s.evenement'),
      render: (v, row) => (
        <div className="flex items-center gap-2 min-w-0">
          <Tag color={row.tone} bordered={false} className="!mr-0 !px-1.5 shrink-0">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current align-middle" />
          </Tag>
          <span className={`text-[0.82rem] truncate ${row.read ? 'text-text-secondary' : 'text-text-heading font-medium'}`}>
            {v}
          </span>
        </div>
      ),
    },
    {
      key: 'at', title: t('s.date'), width: 150,
      render: (v) => (
        <span className="text-[0.76rem] text-text-muted tabular-nums whitespace-nowrap"
              title={new Date(v).toLocaleString('fr-FR')}>
          {since(t, v)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatsCard icon={BellOutlined} label={t('s.non_lues')} value={unread} accentColor="#6366f1" />
        <StatsCard icon={ThunderboltOutlined} label={t('s.aujourd_hui')} value={today} accentColor="#10b981" />
        <StatsCard icon={InboxOutlined} label={t('s.total')} value={items.length} accentColor="#8b5cf6" />
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder={t('s.rechercher_une_notification')} />
        <Select
          value={filter}
          onChange={setFilter}
          width={170}
          options={[
            { value: 'all', label: t('s.toutes') },
            { value: 'unread', label: t('s.non_lues') },
          ]}
        />
        <span className="flex-1" />
        <span className="flex items-center gap-1.5 pr-1">
          <WifiOutlined style={{ fontSize: 11 }}
                        className={status === 'SUBSCRIBED' ? 'text-emerald-500' : 'text-text-muted'} />
          <span className="text-[0.72rem] text-text-muted whitespace-nowrap">
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

      <Panel noPadding>
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          onRowClick={open}
          emptyIcon={BellOutlined}
          emptyTitle={filter === 'unread' ? t('s.aucune_notification_non_lue') : t('s.aucune_notification')}
          emptyDescription={t('s.les_evenements_apparaitront_ici_en_direct')}
        />
      </Panel>
    </div>
  );
};

export default NotificationsPanel;
