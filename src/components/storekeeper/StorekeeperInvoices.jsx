import React, { useState, useMemo } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import SearchComponent from '../common/SearchComponent';
import DataTable from '../common/DataTable';
import { FileText, Search, User, Package, Calendar } from 'lucide-react';

const StorekeeperInvoices = () => {
  const { allSales, currentUser } = useStore();
  const [search, setSearch] = useState('');
  const [expandedSale, setExpandedSale] = useState(null);

  // Filtrer les ventes pour le magasin du magasinier uniquement (si un article appartient au magasin)
  const myStoreSales = useMemo(() => {
    return allSales.filter(s => s.items.some(i => i.storeId === currentUser?.storeId));
  }, [allSales, currentUser]);

  const filtered = myStoreSales.filter(s =>
    (s.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    s.cashier.toLowerCase().includes(search.toLowerCase()) ||
    s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    { key: 'invoiceNumber', title: 'N° Facture', render: (val) => <span className="font-black text-primary">#{val}</span>, width: '150px' },
    { key: 'date', title: 'Date', render: (val) => (
      <div className="flex flex-col">
        <span className="text-sm font-bold text-text-heading">{new Date(val).toLocaleDateString('fr-FR')}</span>
        <span className="text-[0.65rem] opacity-50">{new Date(val).toLocaleTimeString('fr-FR')}</span>
      </div>
    )},
    { key: 'cashier', title: 'Caissier', render: (val) => (
      <div className="flex items-center gap-2">
        <User size={12} className="text-text-muted" />
        <span className="text-sm font-medium">{val}</span>
      </div>
    )},
    { key: 'items', title: 'Articles', render: (val) => <span className="text-[0.8rem] opacity-70">{val.length} articles</span> },
    { key: 'total', title: 'Montant', render: (val) => <span className="font-black text-text-heading">{formatPrice(val)}</span> },
    { key: 'deliveryStatus', title: 'Livraison', render: (val, row) => (
      <div className="flex flex-col gap-1">
        <span className={`badge ${val === 'delivered' ? 'badge-success' : 'badge-warning'}`}>
          {val === 'delivered' ? 'Livré' : 'En attente'}
        </span>
        {row.status === 'cancelled' && <span className="text-[0.6rem] font-black text-red-500 uppercase">ANNULÉE</span>}
      </div>
    )},
  ];

  const renderExpanded = (sale) => (
    <div className="p-6 bg-black/5 dark:bg-black/20 rounded-xl mx-4 mb-4 border border-black/5 dark:border-white/5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest">Détails des articles vendus</div>
        <div className={`text-[0.6rem] font-black uppercase tracking-widest px-3 py-1 rounded-full ${sale.deliveryStatus === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
          Statut: {sale.deliveryStatus === 'delivered' ? 'Marchandise sortie' : 'En attente de sortie'}
        </div>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-black/5 dark:border-white/5">
            {['Produit', 'Quantité', 'Prix Unit.', 'Sous-total'].map(h => (
              <th key={h} className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest pb-3 px-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx} className="border-b border-black/5 dark:border-white/5 last:border-0 group">
              <td className="py-3 px-2 text-[0.85rem] font-semibold text-text-heading group-hover:text-primary transition-colors">
                <div className="flex items-center gap-2">
                  <Package size={14} className="opacity-30" />
                  {item.name}
                </div>
              </td>
              <td className="py-3 px-2 text-[0.85rem] text-text-secondary">
                <span className="font-black text-text-heading">x{item.quantity}</span>
              </td>
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
      <div className="bg-bg-card p-6 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between">
        <div className="relative w-full max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50" />
          <input
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-[0.9rem] text-text-heading placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-all"
            placeholder="Rechercher par n° de facture ou article..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => setExpandedSale(expandedSale === row.id ? null : row.id)}
          expandedRowId={expandedSale}
          renderExpandedRow={renderExpanded}
          emptyIcon={FileText}
          emptyTitle="Aucune facture"
          emptyDescription="Les ventes réalisées dans votre magasin apparaîtront ici."
        />
      </div>
    </div>
  );
};

export default StorekeeperInvoices;
