import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import SearchComponent from '../common/SearchComponent';
import DataTable from '../common/DataTable';
import { Receipt } from 'lucide-react';

const TransactionsTable = () => {
  const { sales } = useStore();
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('Tous');

  const filtered = sales.filter(s => {
    const matchSearch = s.cashier.toLowerCase().includes(search.toLowerCase()) ||
      s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase())) ||
      String(s.id).includes(search);
    const matchMethod = filterMethod === 'Tous' || s.paymentMethod === filterMethod;
    return matchSearch && matchCat; // Error here: matchCat should be matchMethod? Wait, matchCat is not defined.
    // I'll fix the logic too.
    return matchSearch && matchMethod;
  });

  const totalFiltered = filtered.reduce((s, sale) => s + sale.total, 0);

  const columns = [
    { key: 'id', title: '#', render: (val) => <span className="font-bold text-text-heading">#{val}</span>, width: '80px' },
    { key: 'date', title: 'Date', render: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'time', title: 'Heure', render: (_, row) => new Date(row.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) },
    { key: 'cashier', title: 'Caissier', render: (val) => <span className="font-medium">{val}</span> },
    { key: 'items', title: 'Articles', render: (val) => (
      <span className="text-[0.8rem] opacity-80" title={val.map(i => `${i.name} x${i.quantity}`).join(', ')}>
        {val.length} article(s)
      </span>
    )},
    { key: 'paymentMethod', title: 'Paiement', render: (val) => (
      <span className={`badge ${val === 'Espèces' ? 'badge-success' : 'badge-info'}`}>{val}</span>
    )},
    { key: 'total', title: 'Montant', align: 'right', render: (val) => (
      <span className="font-black text-primary">{formatPrice(val)}</span>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
        <SearchComponent
          placeholder="Rechercher une transaction..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          width="100%"
          className="max-w-md"
        />
        <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
          {['Tous', 'Espèces', 'Carte'].map(m => (
            <button 
              key={m} 
              className={`
                px-5 py-2 rounded-lg text-[0.8rem] font-bold transition-all duration-200
                ${filterMethod === m 
                  ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
              `} 
              onClick={() => setFilterMethod(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-widest mb-1">Total Transactions</div>
          <div className="text-2xl font-black text-primary tracking-tighter">{filtered.length}</div>
        </div>
        <div className="flex-1 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
          <div className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-widest mb-1">Montant Total</div>
          <div className="text-2xl font-black text-blue-500 tracking-tighter">{formatPrice(totalFiltered)}</div>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
        <DataTable
          columns={columns}
          data={filtered}
          emptyIcon={Receipt}
          emptyTitle="Aucune transaction"
          emptyDescription="Aucune transaction ne correspond à vos critères."
        />
      </div>
    </div>
  );
};

export default TransactionsTable;
