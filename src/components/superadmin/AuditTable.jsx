import { useT } from '../../i18n/I18nContext';
import React, { useEffect, useState } from 'react';
import { Tag } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { Panel, Table } from '../ui';
import { fetchAuditLog } from '../../services/operationsService';

/** Libellés lisibles ; toute action inconnue s'affiche telle quelle. */
/** Clés de libellé ; toute action inconnue s'affiche telle quelle. */
const LABEL_KEYS = {
  'company.created': 's.entreprise_creee',
  'company.updated': 's.entreprise_modifiee',
  'company.suspended': 's.entreprise_suspendue',
  'company.reactivated': 's.entreprise_reactivee',
  'company.deleted': 's.entreprise_supprimee',
  'company.exported': 's.donnees_exportees',
  'company.feature_changed': 's.module_modifie',
  'member.role_changed': 's.role_modifie',
  'member.suspended': 's.membre_suspendu',
  'member.reactivated': 's.membre_reactive',
  'member.password_reset_sent': 's.reinitialisation_envoyee',
};

const TONE = (action) =>
  /deleted|suspended/.test(action) ? 'red'
  : /created|reactivated/.test(action) ? 'green'
  : 'default';

const AuditTable = ({ companyId }) => {
  const t = useT();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuditLog({ companyId })
      .then(setRows)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [companyId]);

  const columns = [
    {
      key: 'created_at', title: t('s.date'),
      render: (v) => (
        <span className="text-[0.76rem] tabular-nums whitespace-nowrap">
          {new Date(v).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
    {
      key: 'action', title: t('s.action'),
      render: (v) => <Tag color={TONE(v)} bordered={false}>{LABEL_KEYS[v] ? t(LABEL_KEYS[v]) : v}</Tag>,
    },
    { key: 'target', title: t('s.objet'), render: (v) => <span className="text-[0.78rem]">{v || '—'}</span> },
    !companyId && {
      key: 'company_name', title: t('s.entreprise'),
      render: (v) => <span className="text-[0.78rem] text-text-secondary">{v || '—'}</span>,
    },
    {
      key: 'actor_name', title: t('s.auteur'),
      render: (v, row) => (
        <span className="text-[0.78rem]">
          {v || '—'} <span className="text-text-muted">({row.actor_role || '?'})</span>
        </span>
      ),
    },
  ].filter(Boolean);

  return (
    <Panel noPadding>
      {error && <p className="px-4 py-3 text-[0.8rem] text-red-500">{error}</p>}
      <Table
        columns={columns} data={rows} loading={loading} rowKey="id"
        emptyIcon={FileTextOutlined}
        emptyTitle={t('s.aucune_trace')}
        emptyDescription={t('s.les_actions_sensibles_apparaitront_ici')}
      />
    </Panel>
  );
};

export default AuditTable;
