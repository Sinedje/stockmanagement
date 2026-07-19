import React, { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import FinancialSummary from '../components/accountant/FinancialSummary';
import TransactionsTable from '../components/accountant/TransactionsTable';
import StockMovementsPanel from '../components/accountant/StockMovementsPanel';
import ReleaseNotes from '../components/manager/ReleaseNotes';
import ClosureHistory from '../components/common/ClosureHistory';
import CEODashboardHome from '../components/ceo/DashboardHome';
import { BarChart3, Receipt, FileText, ClipboardList, TrendingUp, Truck } from 'lucide-react';

const sidebarItems = [
  { id: 'summary', label: 'Résumé Financier', icon: BarChart3 },
  { id: 'strategic', label: 'Vue Stratégique', icon: TrendingUp },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'movements', label: 'Mouvements de Stock', icon: Truck },
  { id: 'reports', label: 'Liste des Bilans', icon: ClipboardList },
  { id: 'releases', label: 'Bon de Sortie', icon: FileText },
];

const AccountantDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');

  const titles = { 
    summary: 'Résumé Financier', 
    strategic: 'Vue Stratégique',
    transactions: 'Historique des Transactions',
    movements: 'Mouvements de Stock',
    reports: 'Liste des Bilans de Caisse',
    releases: 'Bons de Sortie Marchandises'
  };
  const subtitles = { 
    summary: 'Aperçu de la performance financière', 
    strategic: 'Performances globales, stocks et analyse du catalogue',
    transactions: 'Détails de toutes les transactions',
    movements: 'Entrées fournisseurs et transferts inter-magasins avec prix d\'achat',
    reports: 'Historique des clôtures journalières par caisse',
    releases: 'Suivi et export des sorties marchandises'
  };

  return (
    <DashboardLayout
      items={sidebarItems}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={titles[activeTab]}
      subtitle={subtitles[activeTab]}
    >
      <div className="animate-fade-in min-h-[600px]">
        {activeTab === 'summary' && <FinancialSummary />}
        {activeTab === 'strategic' && <CEODashboardHome />}
        {activeTab === 'transactions' && <TransactionsTable />}
        {activeTab === 'movements' && <StockMovementsPanel />}
        {activeTab === 'reports' && <ClosureHistory />}
        {activeTab === 'releases' && <ReleaseNotes />}
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
