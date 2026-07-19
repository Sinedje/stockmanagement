import React from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales } from '../../hooks';
import EmptyState from '../common/EmptyState';
import { ShoppingCart, Trash2, Minus, Plus, FileText, Store } from 'lucide-react';
import { Button } from 'antd';

const Cart = ({ onCheckout }) => {
  const { cart, cartTotal, updateCartQuantity, clearCart, nextInvoiceNumber } = useSales();

  const Header = () => (
    <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/10">
      <div className="flex items-center gap-2">
        <ShoppingCart size={18} className="text-primary" />
        <h3 className="text-[0.95rem] font-bold text-text-heading uppercase tracking-wide">Panier</h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="badge badge-info">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
        {cart.length > 0 && (
          <Button type="text" danger icon={<Trash2 size={14} />} onClick={clearCart} size="small" />
        )}
      </div>
    </div>
  );

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={ShoppingCart}
            title="Panier vide"
            description="Sélectionnez des produits pour commencer."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      <Header />

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {cart.map(item => (
          <div key={item.productId} className="group flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all">
            <div className="flex-1 min-w-0">
              <div className="text-[0.88rem] font-semibold text-text-heading truncate">{item.name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="text-[0.72rem] text-text-secondary font-medium opacity-60">
                  {formatPrice(item.price)}
                </div>
                {item.storeName && (
                  <>
                    <span className="text-white/20 text-[0.6rem]">•</span>
                    <div className="flex items-center gap-1 opacity-50">
                      <Store size={9} className="text-primary" />
                      <span className="text-[0.62rem] font-bold text-primary truncate max-w-[80px]">
                        {item.storeName}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1 border border-white/5">
              <button
                className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
                onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
              >
                <Minus size={12} />
              </button>
              <span className="w-5 text-center text-[0.8rem] font-bold">{item.quantity}</span>
              <button
                className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-primary transition-colors"
                onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="text-[0.85rem] font-black text-primary text-right min-w-[70px]">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 bg-black/20 border-t border-white/5 space-y-4">
        {/* Prochain numéro de facture */}
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/15 rounded-xl">
          <FileText size={13} className="text-primary opacity-70" />
          <span className="text-[0.7rem] text-text-muted font-semibold uppercase tracking-widest flex-1">Facture</span>
          <span className="text-[0.9rem] font-black text-primary tracking-wider">{nextInvoiceNumber}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest">Total</span>
          <span className="text-xl font-black text-primary tracking-tight">{formatPrice(cartTotal)}</span>
        </div>

        <Button
          type="primary"
          block
          size="large"
          onClick={onCheckout}
          className="h-12 text-[0.95rem] font-black uppercase tracking-wider rounded-xl shadow-glow"
        >
          Valider la commande
        </Button>
      </div>
    </div>
  );
};

export default Cart;
