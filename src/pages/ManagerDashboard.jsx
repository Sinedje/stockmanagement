import React, { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DashboardHome from '../components/manager/DashboardHome';
import CEODashboardHome from '../components/ceo/DashboardHome';
import PhysicalInventory from '../components/manager/PhysicalInventory';
import SalesHistory from '../components/manager/SalesHistory';
import StoresPanel from '../components/manager/StoresPanel';
import CashiersPanel from '../components/manager/CashiersPanel';
import GlobalFinancialReport from '../components/manager/GlobalFinancialReport';
import ReleaseNotes from '../components/manager/ReleaseNotes';
import ManagerDeliveries from '../components/manager/ManagerDeliveries';
import StockEntryPanel from '../components/manager/StockEntryPanel';
import ProductList from '../components/cashier/ProductList';
import ClosureHistory from '../components/common/ClosureHistory';
import TransferManager from '../components/manager/TransferManager';
import BreakagePanel from '../components/manager/BreakagePanel';
import { LayoutDashboard, Package, History, Home, Users, Wallet, FileText, ShoppingBag, Truck, PlusCircle, BarChart3, ClipboardCheck, ArrowRightLeft, TrendingUp, PackageOpen } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const sidebarItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { id: 'strategic', label: 'Vue Stratégique', icon: TrendingUp },
  { id: 'inventory', label: 'Inventaire Physique', icon: ClipboardCheck },
  { id: 'stock_entry', label: 'Gestion des Produits', icon: PlusCircle },
  { id: 'articles', label: 'Liste des Articles', icon: ShoppingBag },
  { id: 'sales', label: 'Historique Ventes', icon: History },
  { id: 'deliveries', label: 'Suivi Livraisons', icon: Truck },
  { id: 'financial', label: 'Bilan Financier', icon: Wallet },
  { id: 'reports', label: 'Liste des Bilans', icon: BarChart3 },
  { id: 'releases', label: 'Bon de Sortie', icon: FileText },
  { id: 'breakage', label: 'Casses & Recond.', icon: PackageOpen },
  { id: 'transfers', label: 'Transferts Inter-Magasins', icon: ArrowRightLeft },
  { id: 'stores', label: 'Magasins', icon: Home },
  { id: 'cashiers', label: 'Gestion du personnel', icon: Users },
];

const ManagerDashboard = () => {
  const { activeStore, logout, lowStockProducts, transfers, activeStoreId } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  const pendingIncomingTransfers = transfers.filter(t => t.toStoreId === activeStoreId && t.status === 'in_transit').length;

  const items = sidebarItems.map(item => {
    if (item.id === 'inventory' && lowStockProducts.length > 0) {
      return { ...item, badge: lowStockProducts.length };
    }
    if (item.id === 'transfers' && pendingIncomingTransfers > 0) {
      return { ...item, badge: pendingIncomingTransfers };
    }
    return item;
  });

  const titles = { 
    dashboard: 'Tableau de Bord', 
    strategic: 'Vue Stratégique',
    inventory: 'Audit & Inventaire Physique', 
    stock_entry: 'Catalogue & Entrée de Stock',
    sales: 'Historique des Ventes',
    deliveries: 'Suivi des Livraisons',
    financial: 'Bilan Financier Global',
    reports: 'Liste des Bilans de Caisse',
    releases: 'Bons de Sortie Marchandises',
    breakage: 'Casses & Reconditionnement',
    transfers: 'Transferts Inter-Magasins',
    articles: 'Liste des Articles',
    stores: 'Gestion des Magasins',
    cashiers: 'Gestion du personnel'
  };
  const subtitles = { 
    dashboard: 'Vue d\'ensemble de votre activité', 
    strategic: 'Performances globales, stocks et analyse du catalogue',
    inventory: 'Effectuer un comptage physique et ajuster les stocks', 
    stock_entry: 'Gérer le catalogue produits et les réceptions fournisseurs',
    sales: 'Consulter toutes les transactions',
    deliveries: 'Suivi en temps réel des sorties de stock par les magasiniers',
    financial: 'Suivi financier de tous les points de vente et caisses',
    reports: 'Consulter l\'historique des clôtures journalières',
    releases: 'Suivi et export des sorties marchandises',
    breakage: 'Gérez vos cartons endommagés et le reconditionnement en sacs',
    transfers: 'Gérer les envois et réceptions de stock entre vos points de vente',
    articles: 'Catalogue complet des produits',
    stores: 'Gérez vos points de vente',
    cashiers: 'Gérez vos comptes caissiers et magasiniers'
  };

  return (
    <DashboardLayout
      items={items}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={titles[activeTab]}
      subtitle={subtitles[activeTab]}
    >
      {activeTab === 'dashboard' && <DashboardHome />}
      {activeTab === 'strategic' && <CEODashboardHome />}
      {activeTab === 'inventory' && <PhysicalInventory />}
      {activeTab === 'stock_entry' && <StockEntryPanel />}
      {activeTab === 'articles' && <ProductList />}
      {activeTab === 'sales' && <SalesHistory />}
      {activeTab === 'deliveries' && <ManagerDeliveries />}
      {activeTab === 'financial' && <GlobalFinancialReport />}
      {activeTab === 'reports' && <ClosureHistory />}
      {activeTab === 'releases' && <ReleaseNotes />}
      {activeTab === 'breakage' && <BreakagePanel />}
      {activeTab === 'transfers' && <TransferManager />}
      {activeTab === 'stores' && <StoresPanel />}
      {activeTab === 'cashiers' && <CashiersPanel />}
    </DashboardLayout>
  );
};

export default ManagerDashboard;
