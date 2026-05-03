import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import SearchComponent from '../common/SearchComponent';
import DataTable from '../common/DataTable';
import { History } from 'lucide-react';

const SalesHistory = () => {
  const { sales } = useStore();
  const [search, setSearch] = useState('');
  const [expandedSale, setExpandedSale] = useState(null);

  const filtered = sales.filter(s =>
    s.cashier.toLowerCase().includes(search.toLowerCase()) ||
    s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase())) ||
    String(s.id).includes(search)
  );

  const columns = [
    { key: 'id', title: 'ID', render: (val) => <span className="font-bold text-text-heading">#{val}</span>, width: '100px' },
    { key: 'date', title: 'Date', render: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'time', title: 'Heure', render: (_, row) => new Date(row.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
    { key: 'cashier', title: 'Caissier', render: (val) => <span className="font-medium text-text-secondary">{val}</span> },
    { key: 'items', title: 'Articles', render: (val) => <span className="text-[0.8rem] opacity-70">{val.length} articles</span> },
    { key: 'total', title: 'Total', render: (val) => <span className="font-black text-primary">{formatPrice(val)}</span> },
    { key: 'paymentMethod', title: 'Paiement', render: (val) => <span className={`badge ${val === 'Espèces' ? 'badge-success' : 'badge-info'}`}>{val}</span> },
  ];

  const renderExpanded = (sale) => (
    <div className="p-6 bg-black/10 rounded-xl mx-4 mb-4 border border-white/5 animate-fade-in">
      <div className="text-[0.7rem] font-bold text-text-muted uppercase tracking-widest mb-4">Détails de la transaction</div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5">
            {['Produit', 'Qté', 'Prix Unit.', 'Sous-total'].map(h => (
              <th key={h} className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest pb-3 px-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx} className="border-b border-white/5 last:border-0 group">
              <td className="py-3 px-2 text-[0.85rem] font-semibold text-text-heading group-hover:text-primary transition-colors">{item.name}</td>
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
      <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
        <SearchComponent
          placeholder="Rechercher une vente par ID, caissier ou produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          width="100%"
          className="max-w-2xl"
        />
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
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
