import React, { useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useSales } from '../../hooks';
import SearchComponent from '../common/SearchComponent';
import DataTable from '../common/DataTable';
import { History, XCircle, AlertCircle } from 'lucide-react';
import { Popconfirm, Button, Tooltip, message } from 'antd';

const SalesHistory = () => {
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
    { key: 'invoiceNumber', title: 'N° Facture', render: (val, row) => (
      <div className="flex flex-col">
        <span className="font-bold text-text-heading">{val || `#${row.id}`}</span>
        {row.type === 'return' && <span className="text-[0.55rem] font-black text-orange-500 uppercase tracking-tighter">Retour sur {row.originalInvoiceNumber}</span>}
      </div>
    )},
    { key: 'date', title: 'Date', render: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'cashier', title: 'Caissier', render: (val) => <span className="font-medium text-text-secondary">{val}</span> },
    { key: 'total', title: 'Total', render: (val) => <span className="font-black text-primary">{formatPrice(val)}</span> },
    { key: 'status', title: 'Statut', render: (_, row) => {
      if (row.status === 'cancelled') return <span className="badge badge-danger">ANNULÉE</span>;
      if (row.type === 'return') return <span className="badge bg-orange-500/10 text-orange-500 border border-orange-500/20">RETOUR</span>;
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
      title: 'Actions', 
      render: (_, row) => {
        const isManager = currentUser?.role === 'manager';
        const isOwnSale = row.cashier === currentUser?.name;
        const canCancel = (isManager || isOwnSale) && row.status !== 'cancelled' && row.type !== 'return';

        if (!canCancel) return null;

        return (
          <Popconfirm
            title="Annuler cette facture ?"
            description="Le stock sera restauré et la vente sera marquée comme annulée."
            onConfirm={() => handleCancel(row)}
            okText="Oui, annuler"
            cancelText="Non"
            icon={<AlertCircle style={{ color: 'red' }} />}
          >
            <Tooltip title="Annuler la vente">
              <Button 
                type="text" 
                danger 
                icon={<XCircle size={18} />} 
                className="hover:scale-110 transition-transform"
              />
            </Tooltip>
          </Popconfirm>
        );
      }
    }
  ];

  const renderExpanded = (sale) => (
    <div className="p-6 bg-black/5 dark:bg-black/20 rounded-xl mx-4 mb-4 border border-black/5 dark:border-white/5 animate-fade-in">
      <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest mb-4">Détails de la transaction</div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-black/5 dark:border-white/5">
            {['Produit', 'Qté', 'Prix Unit.', 'Sous-total'].map(h => (
              <th key={h} className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest pb-3 px-2">{h}</th>
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
              <td className="py-3 px-2 text-[0.85rem] font-black text-primary">{formatPrice(item.price * item.quantity)}</td>
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
          placeholder="Rechercher une vente par ID, caissier ou produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          width="100%"
          className="max-w-2xl"
        />
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => setExpandedSale(expandedSale === row.id ? null : row.id)}
          expandedRowId={expandedSale}
          renderExpandedRow={renderExpanded}
          emptyIcon={History}
          emptyTitle="Aucune vente trouvée"
          emptyDescription="Aucune vente ne correspond à votre recherche."
        />
      </div>
    </div>
  );
};

export default SalesHistory;
