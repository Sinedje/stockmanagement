import { useSectionRoute } from '../routes/sections';
import NotificationsPanel from '../notifications/NotificationsPanel';
import { useT } from '../i18n/I18nContext';
import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DeliveriesPanel from '../components/storekeeper/DeliveriesPanel';
import StorekeeperInvoices from '../components/storekeeper/StorekeeperInvoices';
import ProductList from '../components/cashier/ProductList';
import { CarOutlined, DashboardOutlined, FileTextOutlined, HistoryOutlined, InboxOutlined } from '@ant-design/icons';

const sidebarItems = [
  { id: 'deliveries', label: 'Livraisons', icon: CarOutlined },
  { id: 'invoices', labelKey: 's.liste_des_factures', icon: FileTextOutlined },
  { id: 'inventory', labelKey: 's.etat_du_stock', icon: InboxOutlined },
];

// Sections adressables pour ce rôle : une URL hors de cette liste retombe sur l'accueil.
const SECTIONS = sidebarItems.flatMap(n => n.children ? n.children.map(c => c.id) : [n.id]).concat('notifications');

const StorekeeperDashboard = () => {
  const t = useT();
  const [activeTab, setActiveTab] = useSectionRoute(SECTIONS, 'deliveries');

  const titles = { 
    deliveries: t('s.gestion_des_livraisons'), 
    invoices: t('s.journal_des_factures'),
    inventory: t('s.consultation_du_stock'),
  };
  
  const subtitles = { 
    notifications: t('s.tout_ce_qui_vous_concerne'),
    deliveries: t('s.valider_la_sortie_physique_des_marchandises'), 
    invoices: 'Consulter l\'historique des ventes de votre magasin',
    inventory: t('s.visualiser_les_quantites_disponibles_en_maga'),
  };

  return (
    <DashboardLayout
      items={sidebarItems.map(i => ({ ...i, label: i.labelKey ? t(i.labelKey) : i.label }))}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={titles[activeTab]}
      subtitle={subtitles[activeTab]}
    >
      {activeTab === 'deliveries' && <DeliveriesPanel />}
      {activeTab === 'invoices' && <StorekeeperInvoices />}
      {activeTab === 'inventory' && <ProductList />}
      {activeTab === 'notifications' && <NotificationsPanel />}
    </DashboardLayout>
  );
};

export default StorekeeperDashboard;
