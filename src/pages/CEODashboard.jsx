import React, { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import CEODashboardHome from '../components/ceo/DashboardHome';
import UserManagement from '../components/ceo/UserManagement';
import CompanySettings from '../components/ceo/CompanySettings';
import { LayoutDashboard, Users, Building } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const sidebarItems = [
  { id: 'dashboard', label: 'Vue Stratégique', icon: LayoutDashboard },
  { id: 'users', label: 'Gestion du Personnel', icon: Users },
  { id: 'settings', label: 'Paramètres Entreprise', icon: Building },
];

const CEODashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <DashboardLayout
      items={sidebarItems}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={activeTab === 'dashboard' ? "Vue Stratégique" : activeTab === 'settings' ? "Paramètres de l'Entreprise" : "Gestion du Personnel"}
      subtitle={activeTab === 'dashboard' ? "Vision globale et performances de l'entreprise" : activeTab === 'settings' ? "Informations affichées sur les factures et reçus" : "Administration des accès et des utilisateurs"}
    >
      {activeTab === 'dashboard' && <CEODashboardHome />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'settings' && <CompanySettings />}
    </DashboardLayout>
  );
};

export default CEODashboard;
