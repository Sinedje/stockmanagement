import { useSectionRoute } from '../routes/sections';
import React, { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useT } from '../i18n/I18nContext';
import FinancialSummary from '../components/accountant/FinancialSummary';
import TransactionsTable from '../components/accountant/TransactionsTable';
import StockMovementsPanel from '../components/accountant/StockMovementsPanel';
import ReleaseNotes from '../components/manager/ReleaseNotes';
import ClosureHistory from '../components/common/ClosureHistory';
import CEODashboardHome from '../components/ceo/DashboardHome';
import PendingInvoicesPanel from '../components/manager/PendingInvoicesPanel';
import { BankOutlined, BarChartOutlined, CarOutlined, CompassOutlined, ExclamationCircleOutlined, FileDoneOutlined, FileTextOutlined, ProfileOutlined, RiseOutlined } from '@ant-design/icons';

// Navigation groupée : chaque section se déplie / replie dans la barre latérale.
const sidebarItems = [
  {
    id: 'grp_pilotage',
    labelKey: 'nav.group.pilotage',
    icon: CompassOutlined,
    children: [
      { id: 'summary', labelKey: 'nav.summary', icon: BarChartOutlined },
      { id: 'strategic', labelKey: 'nav.strategic', icon: RiseOutlined },
    ],
  },
  {
    id: 'grp_flux',
    labelKey: 'nav.group.sales',
    icon: FileDoneOutlined,
    children: [
      { id: 'transactions', label: 'Transactions', icon: FileDoneOutlined },
      { id: 'pending_invoices', labelKey: 'nav.pending_invoices', icon: ExclamationCircleOutlined },
      { id: 'movements', labelKey: 'nav.movements', icon: CarOutlined },
    ],
  },
  {
    id: 'grp_documents',
    labelKey: 'nav.group.finance',
    icon: BankOutlined,
    children: [
      { id: 'reports', labelKey: 'nav.reports', icon: ProfileOutlined },
      { id: 'releases', labelKey: 'nav.releases', icon: FileTextOutlined },
    ],
  },
];

// Identifiants des onglets réellement présents dans ce menu : les widgets s'en
// servent pour n'afficher « Voir plus » que vers une page qui existe ici.
const availableTabs = sidebarItems.flatMap(node => node.children ? node.children.map(c => c.id) : [node.id]);

// Sections adressables pour ce rôle : une URL hors de cette liste retombe sur l'accueil.
const SECTIONS = availableTabs;

const AccountantDashboard = () => {
  const t = useT();
  const [activeTab, setActiveTab] = useSectionRoute(SECTIONS, 'summary');

  const titles = { 
    summary: t('s.resume_financier'), 
    strategic: t('s.vue_strategique'),
    transactions: t('s.historique_des_transactions'),
    pending_invoices: t('s.suivi_des_factures'),
    movements: t('s.mouvements_de_stock_2'),
    reports: t('s.liste_des_bilans_de_caisse'),
    releases: t('s.bons_de_sortie_marchandises'),
  };
  const subtitles = { 
    summary: t('s.apercu_de_la_performance_financiere'), 
    strategic: t('s.performances_globales_stocks_et_analyse_du_c'),
    transactions: t('s.details_de_toutes_les_transactions'),
    pending_invoices: t('s.suivi_des_factures_impayees_et_non_livrees'),
    movements: 'Entrées fournisseurs et transferts inter-magasins avec prix d\'achat',
    reports: t('s.historique_des_clotures_journalieres_par_cai'),
    releases: t('s.suivi_et_export_des_sorties_marchandises'),
  };

  return (
    <DashboardLayout
      items={sidebarItems.map(g => ({ ...g, label: t(g.labelKey), children: g.children?.map(c => ({ ...c, label: t(c.labelKey) })) }))}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={t(`nav.${activeTab}`)}
      subtitle={subtitles[activeTab]}
    >
      <div className="animate-fade-in min-h-[600px]">
        {activeTab === 'summary' && <FinancialSummary onNavigate={setActiveTab} availableTabs={availableTabs} />}
        {activeTab === 'strategic' && <CEODashboardHome onNavigate={setActiveTab} availableTabs={availableTabs} />}
        {activeTab === 'transactions' && <TransactionsTable />}
        {activeTab === 'pending_invoices' && <PendingInvoicesPanel />}
        {activeTab === 'movements' && <StockMovementsPanel />}
        {activeTab === 'reports' && <ClosureHistory />}
        {activeTab === 'releases' && <ReleaseNotes />}
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
