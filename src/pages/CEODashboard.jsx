import { useSectionRoute } from '../routes/sections';
import React from 'react';
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
import PendingInvoicesPanel from '../components/manager/PendingInvoicesPanel';
import UserManagement from '../components/ceo/UserManagement';
import CompanySettings from '../components/ceo/CompanySettings';
import { AppstoreOutlined, AuditOutlined, BankOutlined, BarChartOutlined, CarOutlined, CompassOutlined, DashboardOutlined, DropboxOutlined, FileDoneOutlined, FileTextOutlined, HistoryOutlined, HomeOutlined, PlusCircleOutlined, RiseOutlined, SafetyCertificateOutlined, SettingOutlined, ShopOutlined, ShoppingOutlined, SwapOutlined, TeamOutlined, WalletOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/I18nContext';
import { useStores, useProducts } from '../hooks';

// Navigation groupée : chaque section se déplie / replie dans la barre latérale.
// Un noeud sans `children` reste un lien simple.
const sidebarItems = [
  {
    id: 'grp_pilotage',
    labelKey: 'nav.group.pilotage',
    icon: CompassOutlined,
    children: [
      { id: 'strategic', labelKey: 'nav.strategic', icon: RiseOutlined },
      { id: 'dashboard', labelKey: 'nav.dashboard', icon: DashboardOutlined },
    ],
  },
  {
    id: 'grp_stock',
    labelKey: 'nav.group.stock',
    icon: AppstoreOutlined,
    children: [
      { id: 'stock_entry', labelKey: 'nav.stock_entry', icon: PlusCircleOutlined },
      { id: 'articles', labelKey: 'nav.articles', icon: ShoppingOutlined },
      { id: 'inventory', labelKey: 'nav.inventory', icon: AuditOutlined },
      { id: 'transfers', labelKey: 'nav.transfers', icon: SwapOutlined },
      { id: 'breakage', labelKey: 'nav.breakage', icon: DropboxOutlined },
    ],
  },
  {
    id: 'grp_ventes',
    labelKey: 'nav.group.sales',
    icon: FileDoneOutlined,
    children: [
      { id: 'sales', labelKey: 'nav.sales', icon: HistoryOutlined },
      { id: 'pending_invoices', labelKey: 'nav.pending_invoices', icon: FileTextOutlined },
      { id: 'deliveries', labelKey: 'nav.deliveries', icon: CarOutlined },
      { id: 'releases', labelKey: 'nav.releases', icon: FileTextOutlined },
    ],
  },
  {
    id: 'grp_finances',
    labelKey: 'nav.group.finance',
    icon: BankOutlined,
    children: [
      { id: 'financial', labelKey: 'nav.financial', icon: WalletOutlined },
      { id: 'reports', labelKey: 'nav.reports', icon: BarChartOutlined },
    ],
  },
  {
    id: 'grp_admin',
    labelKey: 'nav.group.admin',
    icon: SettingOutlined,
    children: [
      { id: 'stores', labelKey: 'nav.stores', icon: HomeOutlined },
      { id: 'cashiers', labelKey: 'nav.cashiers', icon: TeamOutlined },
      { id: 'users', labelKey: 'nav.users', icon: SafetyCertificateOutlined },
      { id: 'settings', labelKey: 'nav.settings', icon: ShopOutlined },
    ],
  },
];

// Identifiants des onglets réellement présents dans ce menu : les widgets s'en
// servent pour n'afficher « Voir plus » que vers une page qui existe ici.
const availableTabs = sidebarItems.flatMap(node => node.children ? node.children.map(c => c.id) : [node.id]);

// Sections adressables pour ce rôle : une URL hors de cette liste retombe sur l'accueil.
const SECTIONS = availableTabs;

const CEODashboard = () => {
  const t = useT();
  const { logout } = useAuth();
  const { activeStoreId, transfers } = useStores();
  const { lowStockProducts } = useProducts();
  const [activeTab, setActiveTab] = useSectionRoute(SECTIONS, 'strategic');

  const pendingIncomingTransfers = transfers.filter(t => t.toStoreId === activeStoreId && t.status === 'in_transit').length;

  const badges = {
    inventory: lowStockProducts.length || undefined,
    transfers: pendingIncomingTransfers || undefined,
  };

  // `labelKey` est résolu ici : la navigation suit la langue choisie.
  const localise = (node) => ({ ...node, label: t(node.labelKey) });
  const withBadge = (node) => (badges[node.id] ? { ...localise(node), badge: badges[node.id] } : localise(node));
  const items = sidebarItems.map(group =>
    group.children ? { ...localise(group), children: group.children.map(withBadge) } : withBadge(group)
  );

  const titles = { 
    dashboard: t('s.tableau_de_bord'), 
    strategic: t('s.vue_strategique_pdg'),
    inventory: 'Audit & Inventaire Physique', 
    stock_entry: t('s.catalogue_entree_de_stock'),
    sales: t('s.historique_des_ventes'),
    pending_invoices: t('s.suivi_des_factures'),
    deliveries: t('s.suivi_des_livraisons'),
    financial: 'Bilan Financier Global',
    reports: t('s.liste_des_bilans_de_caisse'),
    releases: t('s.bons_de_sortie_marchandises'),
    breakage: 'Casses & Reconditionnement',
    transfers: t('s.transferts_inter_magasins'),
    articles: t('s.liste_des_articles_2'),
    stores: t('s.gestion_des_magasins'),
    cashiers: 'Caissiers et Magasiniers',
    users: t('s.gestion_du_personnel_systeme'),
    settings: 'Paramètres de l\'Entreprise'
  };

  const subtitles = { 
    dashboard: 'Vue d\'ensemble opérationnelle', 
    strategic: t('s.performances_globales_stocks_et_analyse_du_c'),
    inventory: t('s.effectuer_un_comptage_physique_et_ajuster_le'), 
    stock_entry: t('s.gerer_le_catalogue_produits_et_les_reception'),
    sales: t('s.consulter_toutes_les_transactions'),
    pending_invoices: t('s.suivi_des_factures_impayees_et_non_livrees'),
    deliveries: t('s.suivi_en_temps_reel_des_sorties_de_stock_par'),
    financial: t('s.suivi_financier_de_tous_les_points_de_vente_'),
    reports: 'Consulter l\'historique des clôtures journalières',
    releases: t('s.suivi_et_export_des_sorties_marchandises'),
    breakage: t('s.gerez_vos_cartons_endommages_et_le_reconditi'),
    transfers: t('s.gerer_les_envois_et_receptions_de_stock_entr'),
    articles: t('s.catalogue_complet_des_produits'),
    stores: t('s.gerez_vos_points_de_vente'),
    cashiers: t('s.supervisez_les_caissiers_et_magasiniers_du_m'),
    users: t('s.creation_et_gestion_des_comptes_utilisateurs'),
    settings: t('s.votre_compte_et_les_informations_de_l_entrep'),
  };

  return (
    <DashboardLayout
      items={items}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={t(`nav.${activeTab}`)}
      subtitle={subtitles[activeTab]}
    >
      {activeTab === 'dashboard' && <DashboardHome onNavigate={setActiveTab} availableTabs={availableTabs} />}
      {activeTab === 'strategic' && <CEODashboardHome onNavigate={setActiveTab} availableTabs={availableTabs} />}
      {activeTab === 'inventory' && <PhysicalInventory />}
      {activeTab === 'stock_entry' && <StockEntryPanel />}
      {activeTab === 'articles' && <ProductList />}
      {activeTab === 'sales' && <SalesHistory />}
      {activeTab === 'pending_invoices' && <PendingInvoicesPanel />}
      {activeTab === 'deliveries' && <ManagerDeliveries />}
      {activeTab === 'financial' && <GlobalFinancialReport />}
      {activeTab === 'reports' && <ClosureHistory />}
      {activeTab === 'releases' && <ReleaseNotes />}
      {activeTab === 'breakage' && <BreakagePanel />}
      {activeTab === 'transfers' && <TransferManager />}
      {activeTab === 'stores' && <StoresPanel />}
      {activeTab === 'cashiers' && <CashiersPanel />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'settings' && <CompanySettings />}
    </DashboardLayout>
  );
};

export default CEODashboard;
