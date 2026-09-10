import React, { useMemo } from 'react';
import { BankOutlined, ShopOutlined, TeamOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Panel, StatsCard, Widget, WidgetRow } from '../ui';

/** Vue d'ensemble du parc : ce que l'exploitant regarde en premier. */
const PlatformOverview = ({ companies, loading, onGoToCompanies }) => {
  const totals = useMemo(() => ({
    companies: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    suspended: companies.filter(c => c.status === 'suspended').length,
    stores: companies.reduce((s, c) => s + c.storeCount, 0),
    members: companies.reduce((s, c) => s + c.memberCount, 0),
  }), [companies]);

  // Les plus récentes d'abord : c'est ce qui vient d'être créé qu'on surveille.
  const recent = useMemo(
    () => [...companies].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [companies]
  );

  const biggest = useMemo(
    () => [...companies].sort((a, b) => b.memberCount - a.memberCount),
    [companies]
  );

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatsCard icon={BankOutlined} label="Entreprises" value={totals.companies} accentColor="#6366f1" />
        <StatsCard icon={CheckCircleOutlined} label="Actives" value={totals.active} accentColor="#10b981" />
        <StatsCard icon={StopOutlined} label="Suspendues" value={totals.suspended} accentColor="#ef4444" />
        <StatsCard icon={ShopOutlined} label="Magasins" value={totals.stores} accentColor="#3b82f6" />
        <StatsCard icon={TeamOutlined} label="Utilisateurs" value={totals.members} accentColor="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Widget
          title="Dernières entreprises créées" icon={BankOutlined} accentColor="#6366f1"
          items={recent} onSeeMore={onGoToCompanies} seeMoreLabel="Toutes les entreprises"
          emptyText="Aucune entreprise pour le moment"
          renderItem={(c) => (
            <WidgetRow
              label={c.name}
              sub={new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              value={c.status === 'active' ? 'Active' : 'Suspendue'}
              valueClassName={c.status === 'active' ? 'text-primary' : 'text-red-500'}
            />
          )}
        />

        <Widget
          title="Entreprises les plus actives" icon={TeamOutlined} accentColor="#8b5cf6"
          items={biggest} onSeeMore={onGoToCompanies} seeMoreLabel="Toutes les entreprises"
          emptyText="Aucune entreprise pour le moment"
          renderItem={(c) => (
            <WidgetRow
              label={c.name}
              sub={`${c.storeCount} magasin${c.storeCount > 1 ? 's' : ''}`}
              value={`${c.memberCount} membre${c.memberCount > 1 ? 's' : ''}`}
            />
          )}
        />
      </div>

      {loading && (
        <Panel><p className="py-4 text-center text-[0.82rem] text-text-muted">Chargement…</p></Panel>
      )}
    </div>
  );
};

export default PlatformOverview;
