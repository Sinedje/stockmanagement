import React, { useEffect, useMemo, useState } from 'react';
import { BankOutlined, ShopOutlined, TeamOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Panel, StatsCard, Widget, WidgetRow } from '../ui';
import { fetchCompanyActivity } from '../../services/operationsService';

/** Vue d'ensemble du parc : ce que l'exploitant regarde en premier. */
const PlatformOverview = ({ companies, loading, onGoToCompanies }) => {
  // L'activité vient d'une fonction agrégée côté base : compter en JavaScript
  // exigerait de rapatrier toutes les ventes de toutes les entreprises.
  const [activity, setActivity] = useState({});
  useEffect(() => {
    fetchCompanyActivity()
      .then(rows => setActivity(Object.fromEntries(rows.map(r => [r.company_id, r]))))
      .catch(() => { /* le tableau de bord reste utilisable sans ces chiffres */ });
  }, []);

  const dormant = useMemo(
    () => companies.filter(c => !activity[c.id]?.last_login_at),
    [companies, activity]
  );

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
    () => [...companies].sort((a, b) =>
      (activity[b.id]?.sales_30d || 0) - (activity[a.id]?.sales_30d || 0)
      || b.memberCount - a.memberCount),
    [companies, activity]
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

      {dormant.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-[0.8rem] text-amber-700 dark:text-amber-400">
            <strong>{dormant.length} entreprise{dormant.length > 1 ? 's' : ''}</strong> sans
            aucune connexion à ce jour — création faite, mais produit jamais utilisé.
          </p>
        </div>
      )}

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
              sub={`${c.storeCount} magasin${c.storeCount > 1 ? 's' : ''} · ${activity[c.id]?.sales_30d || 0} ventes / 30j`}
              value={activity[c.id]?.last_login_at
                ? `Vu le ${new Date(activity[c.id].last_login_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`
                : 'Jamais connecté'}
              valueClassName={activity[c.id]?.last_login_at ? 'text-primary' : 'text-amber-500'}
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
