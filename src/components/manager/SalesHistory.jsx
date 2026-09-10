import { useT } from '../../i18n/I18nContext';
import { Table } from '../ui';
import React, { useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useSales } from '../../hooks';
import SearchComponent from '../common/SearchComponent';
import { CloseCircleOutlined, ExclamationCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import { Popconfirm, Button, Tooltip, message } from 'antd';

const SalesHistory = () => {
  const t = useT();
  const { currentUser } = useAuth();
  const { sales, cancelSale } = useSales();
  const [search, setSearch] = useState('');
  const [expandedSale, setExpandedSale] = useState(null);

  const filtered = sales.filter(s =>
    s.cashier.toLowerCase().includes(search.toLowerCase()) ||
    s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase())) ||
    String(s.id).includes(search) ||
    (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCancel = (sale) => {
    cancelSale(sale.id);
    message.success(`La facture ${sale.invoiceNumber || sale.id} a été annulée.`);
  };

  const columns = [
    { key: 'invoiceNumber', title: t('s.n_facture'), render: (val, row) => (
      <div className="flex flex-col">
        <span className="font-bold text-text-heading">{val || `#${row.id}`}</span>
        {row.type === 'return' && <span className="text-[0.55rem] font-semibold text-orange-500 uppercase tracking-tighter">Retour sur {row.originalInvoiceNumber}</span>}
      </div>
    )},
    { key: 'date', title: t('s.date'), render: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'cashier', title: t('s.caissier'), render: (val) => <span className="font-medium text-text-secondary">{val}</span> },
    { key: 'customer', title: t('s.client'), render: (_, row) => (
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-text-heading">{row.customerName || 'Passager'}</span>
        {row.customerPhone && <span className="text-[0.65rem] opacity-70">{row.customerPhone}</span>}
      </div>
    )},
    { key: 'total', title: t('s.total'), render: (val) => <span className="font-black text-primary">{formatPrice(val)}</span> },
    { key: 'status', title: t('s.statut'), render: (_, row) => {
      if (row.status === 'cancelled') return <span className="badge badge-danger">{t('s.annulee')}</span>;
      if (row.type === 'return') return <span className="badge bg-orange-500/10 text-orange-500 border border-orange-500/20">{t('s.retour')}</span>;
      const val = row.deliveryStatus;
      return (
        <span className={`badge ${
          val === 'delivered' ? 'badge-success' : 
          val === 'partially_delivered' ? 'badge-warning' : 
          'badge-info'
        }`}>
          {val === 'delivered' ? 'LIVRÉ' : val === 'partially_delivered' ? 'PARTIEL' : 'EN ATTENTE'}
        </span>
      );
    }},
    { 
      key: 'actions', 
      title: t('s.actions'), 
      render: (_, row) => {
        const isManager = currentUser?.role === 'manager';
        const isOwnSale = row.cashier === currentUser?.name;
        const canCancel = (isManager || isOwnSale) && row.status !== 'cancelled' && row.type !== 'return';

        if (!canCancel) return null;

        return (
          <Popconfirm
            title={t('s.annuler_cette_facture')}
            description={t('s.le_stock_sera_restaure_et_la_vente_sera_marq')}
            onConfirm={() => handleCancel(row)}
            okText={t('s.oui_annuler')}
            cancelText={t('s.non')}
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Tooltip title={t('s.annuler_la_vente')}>
              <Button type="text" danger icon={<CloseCircleOutlined style={{ fontSize: 18 }} />} className="hover:scale-110 transition-transform" />
            </Tooltip>
          </Popconfirm>
        );
      }
    }
  ];

  const renderExpanded = (sale) => (
    <div className="p-6 bg-black/5 dark:bg-black/20 rounded-xl mx-4 mb-4 border border-black/5 dark:border-white/5 animate-fade-in">
      <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest mb-4">{t('s.details_de_la_transaction')}</div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-black/5 dark:border-white/5">
            {['Produit', 'Qté', 'Prix Unit.', 'Sous-total'].map(h => (
              <th key={h} className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-widest pb-3 px-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx} className="border-b border-black/5 dark:border-white/5 last:border-0 group">
              <td className="py-3 px-2 text-[0.85rem] font-semibold text-text-heading group-hover:text-primary transition-colors">
                <div className="flex items-center gap-2">
                  <span className={item.isDelivered ? "text-green-500" : "text-orange-500"}>
                    {item.isDelivered ? "✓" : "○"}
                  </span>
                  {item.name}
                </div>
              </td>
              <td className="py-3 px-2 text-[0.85rem] text-text-secondary">{item.quantity}</td>
              <td className="py-3 px-2 text-[0.85rem] text-text-secondary">{formatPrice(item.price)}</td>
              <td className="py-3 px-2 text-[0.85rem] font-semibold text-primary">{formatPrice(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-bg-card p-6 rounded-2xl border border-black/5 dark:border-white/5">
        <SearchComponent
          placeholder={t('s.rechercher_une_vente_par_id_caissier_ou_prod')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          width="100%"
          className="max-w-2xl"
        />
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl">
        <Table
          columns={columns}
          data={filtered}
          onRowClick={(row) => setExpandedSale(expandedSale === row.id ? null : row.id)}
          expandedRowId={expandedSale}
          renderExpandedRow={renderExpanded}
          emptyIcon={HistoryOutlined}
          emptyTitle={t('s.aucune_vente_trouvee')}
          emptyDescription={t('s.aucune_vente_ne_correspond_a_votre_recherche')}
        />
      </div>
    </div>
  );
};

export default SalesHistory;
