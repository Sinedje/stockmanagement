import React, { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DeliveriesPanel from '../components/storekeeper/DeliveriesPanel';
import StorekeeperInvoices from '../components/storekeeper/StorekeeperInvoices';
import ProductList from '../components/cashier/ProductList';
import { Truck, Package, LayoutDashboard, History, FileText } from 'lucide-react';

const sidebarItems = [
  { id: 'deliveries', label: 'Livraisons', icon: Truck },
  { id: 'invoices', label: 'Liste des Factures', icon: FileText },
  { id: 'inventory', label: 'État du Stock', icon: Package },
];

const StorekeeperDashboard = () => {
  const [activeTab, setActiveTab] = useState('deliveries');

  const titles = { 
    deliveries: 'Gestion des Livraisons', 
    invoices: 'Journal des Factures',
    inventory: 'Consultation du Stock'
  };
  
  const subtitles = { 
    deliveries: 'Valider la sortie physique des marchandises', 
    invoices: 'Consulter l\'historique des ventes de votre magasin',
    inventory: 'Visualiser les quantités disponibles en magasin'
  };

  return (
    <DashboardLayout
      items={sidebarItems}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={titles[activeTab]}
      subtitle={subtitles[activeTab]}
    >
      {activeTab === 'deliveries' && <DeliveriesPanel />}
      {activeTab === 'invoices' && <StorekeeperInvoices />}
      {activeTab === 'inventory' && <ProductList />}
    </DashboardLayout>
  );
};

export default StorekeeperDashboard;
