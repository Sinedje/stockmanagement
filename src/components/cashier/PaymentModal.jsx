import React, { useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales } from '../../hooks';
import Modal from '../common/Modal';
import InvoicePrintTemplate from './InvoicePrintTemplate';
import { printInvoice } from '../../utils/printInvoice';
import { CreditCard, Banknote, CheckCircle, Printer, FileText } from 'lucide-react';
import { Button } from 'antd';

const PaymentModal = ({ onClose }) => {
  const { cart, cartTotal, completeSale, nextInvoiceNumber } = useSales();
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
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 shadow-glow">
            <CheckCircle size={36} />
          </div>
          <h3 className="text-xl font-black text-primary uppercase tracking-tighter">Paiement Réussi !</h3>
          <p className="text-text-secondary text-[0.85rem] opacity-60">
            Facture N° <span className="text-primary font-black">{completedSale.invoiceNumber}</span>
          </p>
        </div>

        {/* Aperçu facture formelle */}
        <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
          <InvoicePrintTemplate sale={completedSale} />
        </div>

        <div className="flex gap-4">
          <Button className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider" onClick={onClose}>
            Fermer
          </Button>
          <Button
            type="primary"
            className="flex-1 h-12 rounded-xl font-black uppercase tracking-wider shadow-glow"
            icon={<Printer size={16} />}
            onClick={() => printInvoice('invoice-print-area')}
          >
            Imprimer
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Encaisser" onClose={onClose}>
      <div className="mb-6">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
          <span className="text-[0.8rem] font-bold text-text-secondary uppercase tracking-widest mb-1 block">
            Montant à payer
          </span>
          <span className="text-4xl font-black text-primary tracking-tighter">{formatPrice(cartTotal)}</span>
        </div>
      </div>

      {/* Numéro de facture affiché avant encaissement */}
      <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl">
        <FileText size={14} className="text-primary opacity-70" />
        <span className="text-[0.75rem] text-text-secondary font-semibold">Facture N°</span>
        <span className="text-[1rem] font-black text-primary tracking-widest">{nextInvoiceNumber}</span>
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
            className="flex flex-col items-center justify-center gap-3 p-6 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/20 hover:text-primary text-text-secondary transition-all duration-300 group"
            onClick={() => handlePay('Espèces')}
          >
            <Banknote size={32} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold uppercase tracking-widest text-[0.8rem]">Espèces</span>
          </button>
          <button
            className="flex flex-col items-center justify-center gap-3 p-6 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/20 hover:text-primary text-text-secondary transition-all duration-300 group"
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
