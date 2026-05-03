import React, { useState } from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ProductGrid from '../components/cashier/ProductGrid';
import Cart from '../components/cashier/Cart';
import PaymentModal from '../components/cashier/PaymentModal';
import { LayoutGrid } from 'lucide-react';
import { useStore, formatPrice } from '../context/StoreContext';

const sidebarItems = [
  { id: 'pos', label: 'Point de Vente', icon: LayoutGrid },
];

const CashierPOS = () => {
  const [activeTab, setActiveTab] = useState('pos');
  const [showPayment, setShowPayment] = useState(false);
  const { cart, cartTotal } = useStore();

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

  return (
    <DashboardLayout
      showSidebar={false}
      items={sidebarItems}
      activeItem={activeTab}
      onItemClick={setActiveTab}
      title="Point de Vente"
      subtitle="Sélectionnez des produits et encaissez rapidement"
      headerActions={<CartSummary />}
    >
      <div className="flex flex-col xl:flex-row gap-8 h-[calc(100vh-280px)] min-h-[600px]">
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <ProductGrid />
        </div>
        <div className="w-full xl:w-[420px] shrink-0 h-full flex flex-col">
          <Cart onCheckout={() => setShowPayment(true)} />
        </div>
      </div>
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
    </DashboardLayout>
  );
};

export default CashierPOS;
