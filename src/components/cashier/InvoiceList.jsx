import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import { FileText, Search, Printer, Eye, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Popconfirm, message, Tooltip, Modal, Tag, InputNumber, Select } from 'antd';
import ReceiptView from './ReceiptView';
import ReturnModal from './ReturnModal';

const InvoicePaymentModal = ({ sale, onClose }) => {
  const { recordInvoicePayment } = useStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Espèces');

  const handlePay = () => {
    const val = parseFloat(amount) || 0;
    if (val <= 0 || val > sale.amountDue) {
      message.error("Montant invalide.");
      return;
    }
    recordInvoicePayment(sale.id, val, method);
    message.success("Paiement enregistré avec succès.");
    onClose();
  };

  return (
    <Modal open={true} onCancel={onClose} footer={null} title={<span className="font-black text-text-heading text-xl">Paiement Facture {sale.invoiceNumber}</span>} destroyOnClose>
      <div className="space-y-5 pt-4">
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl space-y-2 text-sm">
          <div className="flex justify-between font-bold">
            <span className="text-text-muted">Total facture:</span> <span className="text-text-heading">{formatPrice(sale.total)}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-500">
            <span>Déjà payé:</span> <span>{formatPrice(sale.amountPaid ?? sale.total)}</span>
          </div>
          <div className="flex justify-between font-black text-red-500 text-lg pt-2 border-t border-black/10 dark:border-white/10 mt-2">
            <span>Reste à solder:</span> <span>{formatPrice(sale.amountDue || 0)}</span>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">Montant versé aujourd'hui</label>
          <InputNumber
            className="w-full" size="large" min={1} max={sale.amountDue}
            value={amount} onChange={setAmount}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            placeholder="0" suffix="FCFA"
          />
        </div>
        <div>
          <label className="text-xs font-black text-text-muted uppercase tracking-widest block mb-2">Mode</label>
          <Select
            className="w-full" size="large" value={method} onChange={setMethod}
            options={[
              { value: 'Espèces', label: 'Espèces' },
              { value: 'Carte', label: 'Carte' },
              { value: 'Mobile Money', label: 'Mobile Money' },
            ]}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button className="flex-1 h-11 rounded-xl font-bold" onClick={onClose}>Annuler</Button>
          <Button type="primary" className="flex-1 h-11 rounded-xl font-bold bg-primary border-none text-black" onClick={handlePay}>Valider le Paiement</Button>
        </div>
      </div>
    </Modal>
  );
};


const InvoiceList = () => {
  const { sales, currentUser, cancelSale } = useStore();
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnSale, setReturnSale] = useState(null);
  const [paymentSale, setPaymentSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer uniquement les ventes du caissier connecté
  const mySales = sales.filter(s => s.cashier === currentUser?.name);

  // Filtrer par numéro de facture ou nom client
  const filteredSales = mySales.filter(s => 
    s.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCancel = (sale) => {
    cancelSale(sale.id);
    message.success(`La facture ${sale.invoiceNumber} a été annulée avec succès.`);
  };

  if (mySales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 opacity-40 gap-4">
        <FileText size={48} strokeWidth={1.5} className="text-text-muted" />
        <p className="text-text-secondary font-semibold">Aucune facture établie pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50" />
        <input
          className="w-full bg-bg-secondary border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-[0.9rem] text-text-heading placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
          placeholder="Rechercher par N° facture ou client..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tableau des factures */}
      <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
              <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">N° Facture</th>
              <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Date & Heure</th>
              <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Client</th>
              <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Statut</th>
              <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted text-right">Total</th>
              <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {filteredSales.map(sale => (
              <tr key={sale.id} className={`transition-colors group ${sale.status === 'cancelled' ? 'bg-red-500/5 opacity-60' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'}`}>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-primary tracking-widest bg-primary/10 px-2 py-1 rounded-lg text-[0.75rem] w-fit">
                      {sale.invoiceNumber}
                    </span>
                    {sale.status === 'cancelled' && <span className="text-[0.6rem] font-black text-red-500 uppercase">ANNULÉE</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[0.85rem] font-bold text-text-heading">
                    {new Date(sale.date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="text-[0.7rem] text-text-muted">
                    {new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[0.85rem] font-semibold text-text-secondary truncate max-w-[150px]">
                    {sale.customerName || 'CLIENT DIVERS'}
                  </div>
                  {sale.customerPhone && <div className="text-[0.7rem] text-text-muted">{sale.customerPhone}</div>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 items-start">
                    {(!sale.paymentStatus || sale.paymentStatus === 'fully_paid') ? (
                      <Tag color="success" className="font-bold border-none m-0 rounded-lg">🟢 SOLDÉE</Tag>
                    ) : sale.paymentStatus === 'partial' ? (
                      <Tag color="warning" className="font-bold border-none m-0 rounded-lg">🟡 PARTIEL</Tag>
                    ) : (
                      <Tag color="error" className="font-bold border-none m-0 rounded-lg">🔴 IMPAYÉE</Tag>
                    )}
                    {(sale.amountDue > 0) && (
                      <span className="text-[0.65rem] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded mt-1">Reste: {formatPrice(sale.amountDue)}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-black text-text-heading text-[0.9rem]">
                  {formatPrice(sale.total)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300"
                      onClick={() => setSelectedSale(sale)}
                      title="Voir la facture"
                    >
                      <Eye size={18} strokeWidth={2.5} />
                    </button>
                    {sale.status !== 'cancelled' && sale.amountDue > 0 && (
                      <button 
                        className="h-9 px-3 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 text-[0.7rem] font-black tracking-widest uppercase"
                        onClick={() => setPaymentSale(sale)}
                        title="Enregistrer un paiement"
                      >
                        Payer
                      </button>
                    )}
                    {sale.status !== 'cancelled' && (
                      <div className="flex items-center gap-2">
                        <Popconfirm
                          title="Annuler cette facture ?"
                          description="Cette action est irréversible."
                          onConfirm={() => handleCancel(sale)}
                          okText="Oui"
                          cancelText="Non"
                          icon={<AlertCircle style={{ color: 'red' }} />}
                        >
                          <button 
                            className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                            title="Annuler la facture"
                          >
                            <XCircle size={18} strokeWidth={2.5} />
                          </button>
                        </Popconfirm>

                        <button 
                          className="h-9 w-9 flex items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300"
                          onClick={() => setReturnSale(sale)}
                          title="Retourner / Échanger"
                        >
                          <RefreshCw size={18} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredSales.length === 0 && (
          <div className="py-12 text-center opacity-30 text-sm font-semibold">
            Aucun résultat correspondant à votre recherche
          </div>
        )}
      </div>

      {selectedSale && (
        <ReceiptView sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}

      {returnSale && (
        <ReturnModal sale={returnSale} onClose={() => setReturnSale(null)} />
      )}

      {paymentSale && (
        <InvoicePaymentModal sale={paymentSale} onClose={() => setPaymentSale(null)} />
      )}
    </div>
  );
};

export default InvoiceList;
