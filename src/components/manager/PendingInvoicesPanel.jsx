import { useT } from '../../i18n/I18nContext';
import { Table } from '../ui';
import React, { useState, useMemo } from 'react';
import PrintHeader from '../common/PrintHeader';
import { formatPrice } from '../../context/StoreContext';
import { useSales } from '../../hooks';
import { CarOutlined, ExclamationCircleOutlined, PrinterOutlined, SearchOutlined, WalletOutlined } from '@ant-design/icons';
import { Tag } from 'antd';

const PendingInvoicesPanel = () => {
  const t = useT();
  const { allSales } = useSales();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'payment', 'delivery'

  const pendingSales = useMemo(() => {
    let filtered = allSales.filter(s => s.status !== 'cancelled' && s.type !== 'return');

    filtered = filtered.filter(s => {
      const isPaymentPending = s.paymentStatus === 'unpaid' || s.paymentStatus === 'partial';
      const isDeliveryPending = s.deliveryStatus === 'pending' || s.deliveryStatus === 'partially_delivered';

      if (filterType === 'all') return isPaymentPending || isDeliveryPending;
      if (filterType === 'payment') return isPaymentPending;
      if (filterType === 'delivery') return isDeliveryPending;
      return false;
    });

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(term)) ||
        (s.customerName && s.customerName.toLowerCase().includes(term)) ||
        (s.cashier && s.cashier.toLowerCase().includes(term))
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allSales, searchTerm, filterType]);

  const columns = [
    { 
      key: 'invoiceNumber', 
      title: t('s.n_facture'), 
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-black text-primary">{val || `#${row.id}`}</span>
          <span className="text-[0.65rem] text-text-muted">{new Date(row.date).toLocaleDateString('fr-FR')}</span>
        </div>
      )
    },
    { 
      key: 'customer', 
      title: t('s.client'), 
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-heading">{row.customerName || 'Passager'}</span>
          {row.customerPhone && <span className="text-[0.65rem] opacity-70">{row.customerPhone}</span>}
        </div>
      )
    },
    { 
      key: 'cashier', 
      title: t('s.caissier'), 
      render: (val) => <span className="font-medium text-text-secondary text-[0.8rem]">{val}</span> 
    },
    { 
      key: 'amounts', 
      title: 'Finances', 
      render: (_, row) => (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center gap-4 text-[0.75rem]">
            <span className="text-text-muted">{t('s.total_2')}</span>
            <span className="font-bold">{formatPrice(row.total)}</span>
          </div>
          <div className="flex justify-between items-center gap-4 text-[0.75rem]">
            <span className="text-text-muted">{t('s.paye_3')}</span>
            <span className="font-bold text-emerald-500">{formatPrice(row.amountPaid)}</span>
          </div>
          {row.amountDue > 0 && (
            <div className="flex justify-between items-center gap-4 text-[0.75rem] pt-1 border-t border-black/5 dark:border-white/5">
              <span className="text-red-500 font-bold uppercase tracking-widest text-[0.6rem]">{t('s.reste_2')}</span>
              <span className="font-black text-red-500">{formatPrice(row.amountDue)}</span>
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'paymentStatus', 
      title: t('s.paiement'), 
      render: (val) => {
        if (val === 'fully_paid') return <Tag color="success">{t('s.paye')}</Tag>;
        if (val === 'partial') return <Tag color="warning">{t('s.partiel')}</Tag>;
        return <Tag color="error">{t('s.impaye')}</Tag>;
      }
    },
    { 
      key: 'deliveryStatus', 
      title: t('s.livraison'), 
      render: (val) => {
        if (val === 'delivered') return <Tag color="success">{t('s.livre')}</Tag>;
        if (val === 'partially_delivered') return <Tag color="warning">{t('s.partiel')}</Tag>;
        return <Tag color="default">{t('s.non_livre')}</Tag>;
      }
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              color: black !important;
              background: white !important;
              padding: 20px;
            }
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 10pt; }
            th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
          }
        `}
      </style>
      <div className="glass-panel rounded-xl p-4 no-print">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
              <button
                className={`px-4 py-2 text-[0.75rem] font-bold rounded-lg transition-all flex items-center gap-2 ${filterType === 'all' ? 'bg-white dark:bg-dark-paper text-primary shadow-sm' : 'text-text-muted hover:text-text-heading'}`}
                onClick={() => setFilterType('all')}
              >
                Tout
              </button>
              <button
                className={`px-4 py-2 text-[0.75rem] font-bold rounded-lg transition-all flex items-center gap-2 ${filterType === 'payment' ? 'bg-white dark:bg-dark-paper text-red-500 shadow-sm' : 'text-text-muted hover:text-text-heading'}`}
                onClick={() => setFilterType('payment')}
              >
                <WalletOutlined style={{ fontSize: 14 }} /> {t('s.impayees')}
              </button>
              <button
                className={`px-4 py-2 text-[0.75rem] font-bold rounded-lg transition-all flex items-center gap-2 ${filterType === 'delivery' ? 'bg-white dark:bg-dark-paper text-orange-500 shadow-sm' : 'text-text-muted hover:text-text-heading'}`}
                onClick={() => setFilterType('delivery')}
              >
                <CarOutlined style={{ fontSize: 14 }} /> {t('s.non_livrees')}
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <SearchOutlined style={{ fontSize: 18 }} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text"
                placeholder={t('s.rechercher')}
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-12 pr-4 py-3 text-[0.85rem] text-text-heading focus:outline-none focus:border-primary/50 transition-all font-bold"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/30 shrink-0"
              title={t('s.imprimer_ou_sauvegarder_en_pdf')}
            >
              <PrinterOutlined style={{ fontSize: 18 }} />
              <span className="hidden sm:inline">{t('s.imprimer_pdf')}</span>
            </button>
          </div>
        </div>

        <Table 
          columns={columns} 
          data={pendingSales} 
        />

        {pendingSales.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-emerald-500/50">
              <ExclamationCircleOutlined style={{ fontSize: 32 }} />
            </div>
            <p className="text-text-muted font-bold">{t('s.aucune_facture_en_attente_tout_est_a_jour')}</p>
          </div>
        )}
      </div>

      <div className="hidden print:block print-area">
        <div className="text-center mb-5">
          <PrintHeader title={t('s.suivi_des_factures_impayees_non_livrees')} />
          <p className="text-sm text-gray-500">Imprimé le {new Date().toLocaleString('fr-FR')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>{t('s.n_facture')}</th>
              <th>{t('s.date')}</th>
              <th>{t('s.client')}</th>
              <th>{t('s.caissier')}</th>
              <th>{t('s.total')}</th>
              <th>{t('s.paye_2')}</th>
              <th>{t('s.reste')}</th>
              <th>{t('s.paiement')}</th>
              <th>{t('s.livraison')}</th>
            </tr>
          </thead>
          <tbody>
            {pendingSales.map(sale => (
              <tr key={sale.id}>
                <td><strong>{sale.invoiceNumber || `#${sale.id}`}</strong></td>
                <td>{new Date(sale.date).toLocaleDateString('fr-FR')}</td>
                <td>{sale.customerName || 'Passager'}</td>
                <td>{sale.cashier}</td>
                <td>{formatPrice(sale.total)}</td>
                <td>{formatPrice(sale.amountPaid)}</td>
                <td style={{ color: sale.amountDue > 0 ? 'red' : 'inherit' }}><strong>{formatPrice(sale.amountDue)}</strong></td>
                <td>
                  {sale.paymentStatus === 'fully_paid' ? 'PAYÉ' : sale.paymentStatus === 'partial' ? 'PARTIEL' : 'IMPAYÉ'}
                </td>
                <td>
                  {sale.deliveryStatus === 'delivered' ? 'LIVRÉ' : sale.deliveryStatus === 'partially_delivered' ? 'PARTIEL' : 'NON LIVRÉ'}
                </td>
              </tr>
            ))}
            {pendingSales.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-4">{t('s.aucune_facture_en_attente')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingInvoicesPanel;
