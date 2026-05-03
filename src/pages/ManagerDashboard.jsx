import React, { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DashboardHome from '../components/manager/DashboardHome';
import InventoryPanel from '../components/manager/InventoryPanel';
import SalesHistory from '../components/manager/SalesHistory';
import { LayoutDashboard, Package, History } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const sidebarItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventaire', icon: Package },
  { id: 'sales', label: 'Historique Ventes', icon: History },
];

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { lowStockProducts } = useStore();

  const items = sidebarItems.map(item =>
    item.id === 'inventory' && lowStockProducts.length > 0
      ? { ...item, badge: lowStockProducts.length }
      : item
  );

  const titles = { dashboard: 'Tableau de Bord', inventory: 'Gestion des Stocks', sales: 'Historique des Ventes' };
  const subtitles = { dashboard: 'Vue d\'ensemble de votre activité', inventory: 'Gérer vos produits et stocks', sales: 'Consulter toutes les transactions' };

  return (
    <DashboardLayout
      items={items}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={titles[activeTab]}
      subtitle={subtitles[activeTab]}
    >
      {activeTab === 'dashboard' && <DashboardHome />}
      {activeTab === 'inventory' && <InventoryPanel />}
      {activeTab === 'sales' && <SalesHistory />}
    </DashboardLayout>
  );
};

export default ManagerDashboard;
