import { useT } from '../i18n/I18nContext';
import React, { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import InvoiceBuilder from '../components/cashier/InvoiceBuilder';
import InvoiceList from '../components/cashier/InvoiceList';
import CustomerList from '../components/cashier/CustomerList';
import ProductList from '../components/cashier/ProductList';
import FinancialReport from '../components/cashier/FinancialReport';
import Cart from '../components/cashier/Cart';
import PaymentModal from '../components/cashier/PaymentModal';
import ClosureHistory from '../components/common/ClosureHistory';
import StockEntryPanel from '../components/manager/StockEntryPanel';
import { BarChartOutlined, FileTextOutlined, HistoryOutlined, InboxOutlined, PlusSquareOutlined, ShoppingCartOutlined, TeamOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { formatPrice } from '../context/StoreContext';
import { useSales } from '../hooks';

const sidebarItems = [
  { id: 'invoice', label: 'Facturation', icon: FileTextOutlined },
  { id: 'invoices', labelKey: 's.liste_des_factures_2', icon: UnorderedListOutlined },
  { id: 'customers', labelKey: 's.liste_des_clients', icon: TeamOutlined },
  { id: 'products', labelKey: 's.liste_des_articles', icon: InboxOutlined },
  { id: 'catalog', labelKey: 's.catalogue_entrees', icon: PlusSquareOutlined },
  { id: 'report', label: 'Bilan financier', icon: BarChartOutlined },
  { id: 'history', labelKey: 's.liste_des_bilans', icon: HistoryOutlined },
];

const CashierPOS = () => {
  const t = useT();
  const [activeTab, setActiveTab] = useState('invoice');
  const [showPayment, setShowPayment] = useState(false);
  const { cart, cartTotal } = useSales();

  const CartSummary = () => (
    <div className="flex items-center gap-4">
      {cart.length > 0 && (
        <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 animate-pulse-slow">
          <span className="text-[0.75rem] font-bold text-primary uppercase tracking-wider">
            {cart.reduce((s, i) => s + i.quantity, 0)} articles
          </span>
          <div className="w-[1px] h-4 bg-primary/30"></div>
          <span className="text-lg font-black text-primary">{formatPrice(cartTotal)}</span>
        </div>
      )}
    </div>
  );

  const titles = {
    invoice: 'Facturation',
    invoices: t('s.liste_des_factures_2'),
    customers: t('s.liste_des_clients'),
    products: t('s.liste_des_articles'),
    catalog: t('s.catalogue_entrees_de_stock'),
    report: 'Bilan Financier',
    history: t('s.historique_des_bilans'),
  };
  const subtitles = {
    invoice: t('s.creez_et_encaissez_des_factures_multi_magasi'),
    invoices: t('s.consultez_et_reimprimez_vos_factures_etablie'),
    customers: 'Gérez vos clients et consultez leur historique d\'achats',
    products: t('s.consultez_les_stocks_disponibles_par_magasin'),
    catalog: t('s.gerez_le_catalogue_et_receptionnez_la_marcha'),
    report: t('s.arretez_vos_comptes_et_visualisez_vos_rappor'),
    history: t('s.consultez_vos_anciennes_clotures_de_caisse'),
  };

  return (
    <DashboardLayout
      items={sidebarItems.map(i => ({ ...i, label: i.labelKey ? t(i.labelKey) : i.label }))}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title={titles[activeTab]}
      subtitle={subtitles[activeTab]}
      headerActions={<CartSummary />}
    >
      {activeTab === 'invoice' && <InvoiceBuilder />}
      
      {activeTab === 'invoices' && <InvoiceList />}

      {activeTab === 'customers' && <CustomerList />}

      {activeTab === 'products' && <ProductList />}
      
      {activeTab === 'catalog' && <StockEntryPanel />}

      {activeTab === 'report' && <FinancialReport />}
      
      {activeTab === 'history' && <ClosureHistory />}

      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
    </DashboardLayout>
  );
};

export default CashierPOS;
