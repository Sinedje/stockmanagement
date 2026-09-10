import { useT } from '../../i18n/I18nContext';
import Modal from '../common/Modal';
import React, { useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales } from '../../hooks';
import { useAuth } from '../../context/AuthContext';
import { CloseCircleOutlined, ExclamationCircleOutlined, EyeOutlined, FileTextOutlined, PrinterOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Popconfirm, message, Tooltip, Tag, InputNumber, Select } from 'antd';
import ReceiptView from './ReceiptView';
import ReturnModal from './ReturnModal';

const InvoicePaymentModal = ({ sale, onClose }) => {
  const t = useT();
  const { recordInvoicePayment } = useSales();
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
    <Modal onClose={onClose} footer={null} title={`Paiement facture ${sale.invoiceNumber}`}>
      <div className="space-y-5 pt-4">
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl space-y-2 text-sm">
          <div className="flex justify-between font-bold">
            <span className="text-text-muted">{t('s.total_facture_3')}</span> <span className="text-text-heading">{formatPrice(sale.total)}</span>
          </div>
          <div className="flex justify-between font-bold text-emerald-500">
            <span>{t('s.deja_paye')}</span> <span>{formatPrice(sale.amountPaid ?? sale.total)}</span>
          </div>
          <div className="flex justify-between font-black text-red-500 text-lg pt-2 border-t border-black/10 dark:border-white/10 mt-2">
            <span>{t('s.reste_a_solder')}</span> <span>{formatPrice(sale.amountDue || 0)}</span>
          </div>
        </div>
        
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">{t('s.montant_verse_aujourd_hui')}</label>
          <InputNumber
            className="w-full" size="large" min={1} max={sale.amountDue}
            value={amount} onChange={setAmount}
            formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            placeholder="0" suffix="FCFA"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">{t('s.mode')}</label>
          <Select
            className="w-full" size="large" value={method} onChange={setMethod}
            options={[
              { value: 'Espèces', label: t('s.especes') },
              { value: 'Carte', label: t('s.carte') },
              { value: 'Mobile Money', label: 'Mobile Money' },
            ]}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button className="flex-1" onClick={onClose}>{t('s.annuler')}</Button>
          <Button type="primary" className="flex-1 bg-primary border-none text-white" onClick={handlePay}>{t('s.valider_le_paiement')}</Button>
        </div>
      </div>
    </Modal>
  );
};


const InvoiceList = () => {
  const t = useT();
  const { sales, cancelSale } = useSales();
  const { currentUser } = useAuth();
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
        <FileTextOutlined style={{ fontSize: 48 }} className="text-text-muted" />
        <p className="text-text-secondary font-semibold">{t('s.aucune_facture_etablie_pour_le_moment')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="relative max-w-md">
        <SearchOutlined style={{ fontSize: 18 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50" />
        <input
          className="w-full bg-bg-secondary border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-[0.9rem] text-text-heading placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-all shadow-sm"
          placeholder={t('s.rechercher_par_n_facture_ou_client')}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tableau des factures */}
      <div className="glass-panel rounded-xl p-4 overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
              <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">{t('s.n_facture')}</th>
              <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">{t('s.date_heure')}</th>
              <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">{t('s.client')}</th>
              <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted">{t('s.statut')}</th>
              <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted text-right">{t('s.total')}</th>
              <th className="px-6 py-4 text-[0.65rem] font-semibold uppercase tracking-widest text-text-muted text-center">{t('s.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5">
            {filteredSales.map(sale => (
              <tr key={sale.id} className={`transition-colors group ${sale.status === 'cancelled' ? 'bg-red-500/5 opacity-60' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'}`}>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-primary tracking-widest bg-primary/10 px-2 py-1 rounded-lg text-[0.75rem] w-fit">
                      {sale.invoiceNumber}
                    </span>
                    {sale.status === 'cancelled' && <span className="text-[0.6rem] font-semibold text-red-500 uppercase">{t('s.annulee')}</span>}
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
                      <Tag color="success" className="font-bold border-none m-0 rounded-lg">{t('s.soldee')}</Tag>
                    ) : sale.paymentStatus === 'partial' ? (
                      <Tag color="warning" className="font-bold border-none m-0 rounded-lg">🟡 PARTIEL</Tag>
                    ) : (
                      <Tag color="error" className="font-bold border-none m-0 rounded-lg">{t('s.impayee')}</Tag>
                    )}
                    {(sale.amountDue > 0) && (
                      <span className="text-[0.65rem] font-semibold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded mt-1">Reste: {formatPrice(sale.amountDue)}</span>
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
                      title={t('s.voir_la_facture')}
                    >
                      <EyeOutlined style={{ fontSize: 18 }} />
                    </button>
                    {sale.status !== 'cancelled' && sale.amountDue > 0 && (
                      <button 
                        className="h-9 px-3 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 text-[0.7rem] font-semibold tracking-widest uppercase"
                        onClick={() => setPaymentSale(sale)}
                        title={t('s.enregistrer_un_paiement')}
                      >
                        Payer
                      </button>
                    )}
                    {sale.status !== 'cancelled' && (
                      <div className="flex items-center gap-2">
                        <Popconfirm
                          title={t('s.annuler_cette_facture')}
                          description={t('s.cette_action_est_irreversible')}
                          onConfirm={() => handleCancel(sale)}
                          okText={t('s.oui')}
                          cancelText={t('s.non')}
                          icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                        >
                          <button 
                            className="h-9 w-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                            title={t('s.annuler_la_facture')}
                          >
                            <CloseCircleOutlined style={{ fontSize: 18 }} />
                          </button>
                        </Popconfirm>

                        <button 
                          className="h-9 w-9 flex items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300"
                          onClick={() => setReturnSale(sale)}
                          title={t('s.retourner_echanger')}
                        >
                          <ReloadOutlined style={{ fontSize: 18 }} />
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
            {t('s.aucun_resultat_correspondant_a_votre_recherc')}
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
