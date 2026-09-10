import { useT } from '../../i18n/I18nContext';
import React, { useState } from 'react';
import Modal from '../common/Modal';
import { formatPrice } from '../../context/StoreContext';
import { useSales } from '../../hooks';
import { InboxOutlined, MinusOutlined, PlusOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';

const ReturnModal = ({ sale, onClose }) => {
  const t = useT();
  const { processReturn } = useSales();
  const [returnQuantities, setReturnQuantities] = useState(
    sale.items.reduce((acc, item) => ({ ...acc, [item.productId]: 0 }), {})
  );

  const updateQty = (productId, delta, max) => {
    setReturnQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [productId]: next };
    });
  };

  const totalReturnAmount = sale.items.reduce((sum, item) => {
    return sum + (item.price * (returnQuantities[item.productId] || 0));
  }, 0);

  const handleConfirm = () => {
    const itemsToReturn = sale.items
      .filter(item => returnQuantities[item.productId] > 0)
      .map(item => ({
        ...item,
        quantity: returnQuantities[item.productId]
      }));

    if (itemsToReturn.length === 0) {
      message.warning('Veuillez sélectionner au moins un article à retourner.');
      return;
    }

    processReturn(sale, itemsToReturn);
    message.success('Le retour a été enregistré avec succès ! Un avoir a été généré pour aujourd\'hui.');
    onClose();
  };

  return (
    <Modal title={t('s.enregistrer_un_retour_echange')} onClose={onClose}>
      <div className="space-y-6">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-4">
          <WarningOutlined style={{ fontSize: 20 }} className="text-orange-500 shrink-0 mt-1" />
          <div>
            <p className="text-[0.85rem] font-bold text-orange-500 uppercase tracking-wide">{t('s.note_importante')}</p>
            <p className="text-[0.7rem] text-text-muted mt-1">
              Cette opération enregistre un retour de marchandise à la date d'aujourd'hui. 
              L'avoir de <span className="font-bold text-text-secondary">{formatPrice(totalReturnAmount)}</span> {t('s.sera_deduit_de_votre_caisse_du_jour')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest px-1">Articles de la facture #{sale.invoiceNumber}</p>
          <div className="bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5 bg-black/10 dark:bg-white/10">
                  <th className="px-4 py-3 text-[0.6rem] font-semibold uppercase tracking-widest text-text-muted">{t('s.article')}</th>
                  <th className="px-4 py-3 text-[0.6rem] font-semibold uppercase tracking-widest text-text-muted text-center">{t('s.vendu')}</th>
                  <th className="px-4 py-3 text-[0.6rem] font-semibold uppercase tracking-widest text-text-muted text-center">{t('s.a_retourner')}</th>
                  <th className="px-4 py-3 text-[0.6rem] font-semibold uppercase tracking-widest text-text-muted text-right">{t('s.sous_total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5">
                {sale.items.map(item => (
                  <tr key={item.productId} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-[0.8rem] font-bold text-text-heading">{item.name}</div>
                      <div className="text-[0.65rem] text-text-muted">{formatPrice(item.price)} / unité</div>
                    </td>
                    <td className="px-4 py-3 text-center text-[0.8rem] font-semibold text-text-muted">
                      {Math.abs(item.quantity)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => updateQty(item.productId, -1, Math.abs(item.quantity))}
                          className="w-6 h-6 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-colors"
                        >
                          <MinusOutlined style={{ fontSize: 12 }} />
                        </button>
                        <span className="text-[0.9rem] font-black text-primary w-4 text-center">
                          {returnQuantities[item.productId]}
                        </span>
                        <button 
                          onClick={() => updateQty(item.productId, 1, Math.abs(item.quantity))}
                          className="w-6 h-6 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors"
                        >
                          <PlusOutlined style={{ fontSize: 12 }} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-[0.8rem] font-semibold text-text-heading">
                      {formatPrice(item.price * returnQuantities[item.productId])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col items-center gap-1">
          <span className="text-[0.7rem] font-semibold text-primary uppercase tracking-widest opacity-60">{t('s.montant_total_a_deduire_de_la_caisse')}</span>
          <span className="text-xl font-bold text-primary tracking-tighter">{formatPrice(totalReturnAmount)}</span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={onClose} className="flex-1">{t('s.annuler')}</Button>
          <Button type="primary" onClick={handleConfirm} disabled={totalReturnAmount === 0} className="flex-1 bg-orange-500 border-orange-500 hover:bg-orange-600 shadow-orange-500/20" icon={<ReloadOutlined style={{ fontSize: 16 }} />} >
            {t('s.valider_le_retour')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReturnModal;
