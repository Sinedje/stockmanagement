import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import Modal from '../common/Modal';
import { CreditCard, Banknote, CheckCircle, Printer } from 'lucide-react';
import { Button } from 'antd';

const PaymentModal = ({ onClose }) => {
  const { cart, cartTotal, completeSale } = useStore();
  const [step, setStep] = useState('method'); // method, receipt
  const [completedSale, setCompletedSale] = useState(null);

  const handlePay = (method) => {
    const sale = completeSale(method);
    if (sale) {
      setCompletedSale(sale);
      setStep('receipt');
    }
  };

  if (step === 'receipt' && completedSale) {
    return (
      <Modal title="Vente Terminée" onClose={onClose}>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 shadow-glow">
            <CheckCircle size={36} />
          </div>
          <h3 className="text-xl font-black text-primary uppercase tracking-tighter">Paiement Réussi !</h3>
          <p className="text-text-secondary text-[0.85rem] opacity-60">Transaction #{completedSale.id}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-inner text-black font-mono text-[0.8rem] mb-6">
          <div className="text-center font-black text-lg mb-1">STOCK EXPERT</div>
          <div className="text-center text-[0.65rem] opacity-60 mb-4 uppercase tracking-widest">
            {new Date(completedSale.date).toLocaleString('fr-FR')}
          </div>
          <div className="border-t border-dashed border-black/20 my-3"></div>
          
          <div className="space-y-1">
            {completedSale.items.map((item, idx) => (
              <div className="flex justify-between" key={idx}>
                <span>{item.name} x{item.quantity}</span>
                <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-black/20 my-3"></div>
          
          <div className="flex justify-between text-base font-black">
            <span>TOTAL</span>
            <span>{formatPrice(completedSale.total)}</span>
          </div>

          <div className="mt-4 pt-4 border-t border-black/10 text-[0.65rem] opacity-70">
            <div>Paiement: {completedSale.paymentMethod}</div>
            <div>Caissier: {completedSale.cashier}</div>
          </div>
          
          <div className="text-center mt-6 text-[0.7rem] font-bold uppercase tracking-widest">
            Merci de votre visite !
          </div>
        </div>

        <div className="flex gap-4">
          <Button 
            className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider"
            onClick={onClose}
          >
            Fermer
          </Button>
          <Button 
            type="primary"
            className="flex-1 h-12 rounded-xl font-black uppercase tracking-wider shadow-glow"
            icon={<Printer size={16} />}
            onClick={() => window.print()}
          >
            Imprimer
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Encaisser" onClose={onClose}>
      <div className="mb-8">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <span className="text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-1 block">Montant à payer</span>
          <span className="text-4xl font-black text-primary tracking-tighter">{formatPrice(cartTotal)}</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <p className="text-[0.85rem] text-text-secondary opacity-70">
          {cart.reduce((s, i) => s + i.quantity, 0)} article(s) dans le panier
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-[0.9rem] font-bold text-text-heading uppercase tracking-wide text-center">Mode de paiement</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all duration-300 group"
            onClick={() => handlePay('Espèces')}
          >
            <Banknote size={32} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold uppercase tracking-widest text-[0.8rem]">Espèces</span>
          </button>
          <button
            className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/20 hover:text-primary transition-all duration-300 group"
            onClick={() => handlePay('Carte')}
          >
            <CreditCard size={32} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold uppercase tracking-widest text-[0.8rem]">Carte</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
