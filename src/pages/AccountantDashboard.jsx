import React, { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import FinancialSummary from '../components/accountant/FinancialSummary';
import TransactionsTable from '../components/accountant/TransactionsTable';
import { BarChart3, Receipt } from 'lucide-react';

const sidebarItems = [
  { id: 'summary', label: 'Résumé Financier', icon: BarChart3 },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
];

const AccountantDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');

  const titles = { summary: 'Résumé Financier', transactions: 'Historique des Transactions' };
  const subtitles = { summary: 'Aperçu de la performance financière', transactions: 'Détails de toutes les transactions' };

  return (
    <DashboardLayout
      showSidebar={false}
      items={sidebarItems}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={titles[activeTab]}
      subtitle={subtitles[activeTab]}
    >
      <div className="animate-fade-in space-y-8">
        {/* Inline Navigation Tabs */}
        <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl w-fit border border-white/5 backdrop-blur-md">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300
                ${activeTab === item.id 
                  ? 'bg-primary text-black shadow-lg shadow-primary/20 scale-105' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
              `}
            >
              <item.icon size={18} strokeWidth={2.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[600px]">
          {activeTab === 'summary' && <FinancialSummary />}
          {activeTab === 'transactions' && <TransactionsTable />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccountantDashboard;
