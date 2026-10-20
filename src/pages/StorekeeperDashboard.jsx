import { useSectionRoute } from '../routes/sections';
import { useT } from '../i18n/I18nContext';
import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DeliveriesPanel from '../components/storekeeper/DeliveriesPanel';
import StorekeeperInvoices from '../components/storekeeper/StorekeeperInvoices';
import ProductList from '../components/cashier/ProductList';
import ReleaseNotes from '../components/manager/ReleaseNotes';
import BelowMinPriceSurveillance from '../components/common/BelowMinPriceSurveillance';
import { useAuth } from '../context/AuthContext';
import { AlertOutlined, CarOutlined, DashboardOutlined, FileTextOutlined, HistoryOutlined, InboxOutlined, ProfileOutlined } from '@ant-design/icons';

const sidebarItems = [
  { id: 'deliveries', label: 'Livraisons', icon: CarOutlined },
  { id: 'releases', label: 'Bons de sortie', icon: ProfileOutlined },
  { id: 'invoices', labelKey: 's.liste_des_factures', icon: FileTextOutlined },
  { id: 'price_surveillance', label: 'Surveillance Prix Bas', icon: AlertOutlined },
  { id: 'inventory', labelKey: 's.etat_du_stock', icon: InboxOutlined },
];

// Sections adressables pour ce rôle : une URL hors de cette liste retombe sur l'accueil.
const SECTIONS = sidebarItems.flatMap(n => n.children ? n.children.map(c => c.id) : [n.id]);

const StorekeeperDashboard = () => {
  const t = useT();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useSectionRoute(SECTIONS, 'deliveries');

  const titles = { 
    deliveries: t('s.gestion_des_livraisons'), 
    releases: 'Bons de sortie de votre magasin',
    invoices: t('s.journal_des_factures'),
    price_surveillance: 'Surveillance Prix Bas',
    inventory: t('s.consultation_du_stock'),
  };
  
  const subtitles = { 
    deliveries: t('s.valider_la_sortie_physique_des_marchandises'), 
    releases: 'Consulter et imprimer les bons de sortie des marchandises de votre magasin',
    invoices: 'Consulter l\'historique des ventes de votre magasin',
    price_surveillance: 'Surveiller les factures avec articles vendus sous le prix minimum',
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
      {activeTab === 'releases' && <ReleaseNotes storeIdFilter={currentUser?.storeId} />}
      {activeTab === 'invoices' && <StorekeeperInvoices />}
      {activeTab === 'price_surveillance' && <BelowMinPriceSurveillance />}
      {activeTab === 'inventory' && <ProductList />}
    </DashboardLayout>
  );
};

export default StorekeeperDashboard;
