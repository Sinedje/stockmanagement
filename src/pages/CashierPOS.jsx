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
import { FileText, ShoppingCart, List, Users, Package, BarChart3, History, PlusSquare } from 'lucide-react';
import { formatPrice } from '../context/StoreContext';
import { useSales } from '../hooks';

const sidebarItems = [
  { id: 'invoice', label: 'Facturation', icon: FileText },
  { id: 'invoices', label: 'Liste des factures', icon: List },
  { id: 'customers', label: 'Liste des clients', icon: Users },
  { id: 'products', label: 'Liste des articles', icon: Package },
  { id: 'catalog', label: 'Catalogue & Entrées', icon: PlusSquare },
  { id: 'report', label: 'Bilan financier', icon: BarChart3 },
  { id: 'history', label: 'Liste des bilans', icon: History },
];

const CashierPOS = () => {
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
    invoices: 'Liste des factures',
    customers: 'Liste des clients',
    products: 'Liste des articles',
    catalog: 'Catalogue & Entrées de Stock',
    report: 'Bilan Financier',
    history: 'Historique des Bilans',
  };
  const subtitles = {
    invoice: 'Créez et encaissez des factures multi-magasins',
    invoices: 'Consultez et réimprimez vos factures établies',
    customers: 'Gérez vos clients et consultez leur historique d\'achats',
    products: 'Consultez les stocks disponibles par magasin',
    catalog: 'Gérez le catalogue et réceptionnez la marchandise pour votre magasin',
    report: 'Arrêtez vos comptes et visualisez vos rapports de vente',
    history: 'Consultez vos anciennes clôtures de caisse',
  };

  return (
    <DashboardLayout
      items={sidebarItems}
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
