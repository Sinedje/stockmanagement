import React, { useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import SearchComponent from '../common/SearchComponent';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import { Receipt, FileText, ShoppingBag, CreditCard, Tag } from 'lucide-react';

const TransactionsTable = () => {
  const { sales } = useStore();
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('Tous');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const filtered = sales.filter(s => {
    const matchSearch = s.cashier.toLowerCase().includes(search.toLowerCase()) ||
      s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase())) ||
      String(s.id).includes(search);
    const matchMethod = filterMethod === 'Tous' || s.paymentMethod === filterMethod;
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

      <div className="bg-bg-secondary rounded-2xl border border-white/5 overflow-hidden shadow-2xl cursor-pointer">
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => setSelectedTransaction(row)}
          emptyIcon={Receipt}
          emptyTitle="Aucune transaction"
          emptyDescription="Aucune transaction ne correspond à vos critères."
        />
      </div>

      {selectedTransaction && (
        <Modal 
          title={`Détails de la transaction #${selectedTransaction.id}`}
          onClose={() => setSelectedTransaction(null)}
          footer={null}
        >
          <div className="space-y-6">
            {/* Header / Info Section */}
            <div className="bg-gradient-to-br from-primary to-emerald-700 p-6 rounded-2xl text-white shadow-xl shadow-primary/20">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[0.65rem] font-black text-white/70 uppercase tracking-widest">Date d'émission</p>
                  <p className="font-black text-white text-lg">
                    {new Date(selectedTransaction.date).toLocaleDateString('fr-FR')} <span className="text-white/70 font-medium text-sm">à {new Date(selectedTransaction.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                  
                  <div className="mt-5">
                    <p className="text-[0.65rem] font-black text-white/70 uppercase tracking-widest">Caissier</p>
                    <div className="font-black text-white text-lg flex items-center gap-2 mt-0.5">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[0.65rem]">👤</div>
                      {selectedTransaction.cashier}
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-[0.65rem] font-black text-white/70 uppercase tracking-widest">Paiement</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[0.75rem] font-black uppercase tracking-widest bg-white text-emerald-700 shadow-sm">
                      <CreditCard size={14} /> {selectedTransaction.paymentMethod}
                    </span>
                  </div>
                  
                  {selectedTransaction.invoiceNumber && (
                    <div className="mt-5">
                      <p className="text-[0.65rem] font-black text-white/70 uppercase tracking-widest">Reçu N°</p>
                      <p className="font-black text-white text-xl tracking-tight mt-0.5">{selectedTransaction.invoiceNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Articles Section */}
            <div className="bg-bg-card border border-black/10 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <ShoppingBag size={14} className="text-primary" />
                </div>
                <span className="text-[0.8rem] font-black uppercase tracking-widest text-text-heading">Articles Achetés</span>
                <span className="ml-auto bg-primary text-black px-2.5 py-0.5 rounded-md text-[0.7rem] font-black shadow-sm">{selectedTransaction.items.length}</span>
              </div>
              
              <div className="divide-y divide-black/5 dark:divide-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
                {selectedTransaction.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-5 hover:bg-primary/5 transition-colors group">
                    <div className="flex-1">
                      <p className="font-black text-text-heading text-[1.05rem] group-hover:text-primary transition-colors">{item.name}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[0.7rem] text-primary bg-primary/10 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">Qté: {item.quantity}</span>
                        <span className="text-[0.8rem] font-bold text-text-muted">× {formatPrice(item.price)}</span>
                      </div>
                    </div>
                    <div className="font-black text-text-heading text-lg">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Section */}
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-900 to-black rounded-2xl shadow-xl">
              <span className="font-black uppercase tracking-widest text-white/70 text-[0.8rem]">Total Facture</span>
              <span className="text-3xl font-black text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] tracking-tighter">
                {formatPrice(selectedTransaction.total)}
              </span>
            </div>

            {/* Action */}
            <button 
              onClick={() => setSelectedTransaction(null)}
              className="w-full py-4 rounded-xl bg-black/5 dark:bg-white/5 text-text-heading hover:bg-black/10 dark:hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[0.8rem]"
            >
              Fermer les détails
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TransactionsTable;
