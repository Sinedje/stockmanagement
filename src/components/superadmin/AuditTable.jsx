import React, { useEffect, useState } from 'react';
import { Tag } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { Panel, Table } from '../ui';
import { fetchAuditLog } from '../../services/operationsService';

/** Libellés lisibles ; toute action inconnue s'affiche telle quelle. */
const LABELS = {
  'company.created': 'Entreprise créée',
  'company.updated': 'Entreprise modifiée',
  'company.suspended': 'Entreprise suspendue',
  'company.reactivated': 'Entreprise réactivée',
  'company.deleted': 'Entreprise supprimée',
  'company.exported': 'Données exportées',
  'company.feature_changed': 'Module modifié',
  'member.role_changed': 'Rôle modifié',
  'member.suspended': 'Membre suspendu',
  'member.reactivated': 'Membre réactivé',
  'member.password_reset_sent': 'Réinitialisation envoyée',
};

const TONE = (action) =>
  /deleted|suspended/.test(action) ? 'red'
  : /created|reactivated/.test(action) ? 'green'
  : 'default';

const AuditTable = ({ companyId }) => {
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
      key: 'created_at', title: 'Date',
      render: (v) => (
        <span className="text-[0.76rem] tabular-nums whitespace-nowrap">
          {new Date(v).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
    },
    {
      key: 'action', title: 'Action',
      render: (v) => <Tag color={TONE(v)} bordered={false}>{LABELS[v] || v}</Tag>,
    },
    { key: 'target', title: 'Objet', render: (v) => <span className="text-[0.78rem]">{v || '—'}</span> },
    !companyId && {
      key: 'company_name', title: 'Entreprise',
      render: (v) => <span className="text-[0.78rem] text-text-secondary">{v || '—'}</span>,
    },
    {
      key: 'actor_name', title: 'Auteur',
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
        emptyTitle="Aucune trace"
        emptyDescription="Les actions sensibles apparaîtront ici."
      />
    </Panel>
  );
};

export default AuditTable;
