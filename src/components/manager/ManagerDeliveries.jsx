import React, { useState, useMemo } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import DataTable from '../common/DataTable';
import { Truck, CheckCircle, Package, User, Store, Search, Clock, AlertCircle, Printer } from 'lucide-react';
import { Tag, Tooltip, Button } from 'antd';

const ManagerDeliveries = () => {
  const { allSales, stores, unlockDelivery, companySettings } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    return allSales.filter(s => 
      s.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cashier.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSales, searchTerm]);

  const nonDeliveredSales = useMemo(() => {
    return allSales.filter(s => s.deliveryStatus !== 'delivered');
  }, [allSales]);

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    { key: 'invoiceNumber', title: 'Facture', render: (val) => <span className="font-black text-primary">#{val}</span> },
    { key: 'date', title: 'Date', render: (val) => (
      <div className="flex flex-col">
        <span className="text-sm font-bold text-text-heading">{new Date(val).toLocaleDateString()}</span>
        <span className="text-[0.65rem] opacity-50">{new Date(val).toLocaleTimeString()}</span>
      </div>
    )},
    { key: 'storeId', title: 'Magasin Vente', render: (val) => {
      const storeName = stores.find(s => s.id === val)?.name || 'Inconnu';
      return (
        <div className="flex items-center gap-2">
          <Store size={12} className="text-text-muted" />
          <span className="text-sm font-medium">{storeName}</span>
        </div>
      );
    }},
    { key: 'items', title: 'Statut par Article / Magasin', render: (val) => (
      <div className="space-y-1.5">
        {val.map((item, idx) => {
          const itemStore = stores.find(s => s.id === item.storeId)?.name || 'Inconnu';
          const delivered = item.quantityDelivered ?? (item.isDelivered ? item.quantity : 0);
          const progress = item.quantity > 0 ? Math.round((delivered / item.quantity) * 100) : 0;
          return (
            <div key={idx} className="flex flex-col gap-1 bg-white/5 px-2 py-1.5 rounded-lg text-[0.7rem]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package size={10} className={item.isDelivered ? 'text-green-500' : delivered > 0 ? 'text-orange-400' : 'text-primary'} />
                  <span className="text-text-secondary">{item.name}</span>
                  <span className="text-[0.6rem] opacity-40 italic">({itemStore})</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`font-black tabular-nums ${
                    item.isDelivered ? 'text-green-500' : delivered > 0 ? 'text-orange-400' : 'text-text-muted'
                  }`}>{delivered}/{item.quantity}</span>
                  {item.isDelivered
                    ? <CheckCircle size={11} className="text-green-500" />
                    : delivered > 0
                      ? <Clock size={11} className="text-orange-400 animate-pulse" />
                      : <Clock size={11} className="text-primary animate-pulse" />}
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div
                  className={`h-1 rounded-full transition-all duration-500 ${
                    progress >= 100 ? 'bg-green-500' : progress > 0 ? 'bg-orange-400' : 'bg-white/20'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    )},
    { key: 'deliveryStatus', title: 'État Global', align: 'right', render: (val, row) => (
      <div className="flex flex-col items-end gap-2">
        <Tag color={val === 'delivered' ? 'success' : val === 'partially_delivered' ? 'warning' : 'error'} className="border-none font-black py-1 px-3 m-0">
          {val === 'delivered' ? 'LIVRÉ' : val === 'partially_delivered' ? 'PARTIEL' : 'EN ATTENTE'}
        </Tag>
        {(row.paymentStatus === 'unpaid' || row.paymentStatus === 'partial') && !row.deliveryUnlocked && (
          <Button 
            size="small" type="primary" 
            className="bg-primary/20 text-primary border-none hover:bg-primary hover:text-black font-bold text-[0.65rem] tracking-widest uppercase"
            onClick={() => unlockDelivery(row.id)}
          >
            Débloquer
          </Button>
        )}
        {(row.paymentStatus === 'unpaid' || row.paymentStatus === 'partial') && row.deliveryUnlocked && (
          <span className="text-[0.6rem] text-primary font-black uppercase tracking-widest">Débloquée 🔓</span>
        )}
      </div>
    )},
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; }
            #print-area {
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
            .badge-print { font-weight: bold; text-transform: uppercase; font-size: 8pt; }
          }
        `}
      </style>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
        <div className="bg-bg-card border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="text-[0.65rem] font-black text-text-muted uppercase tracking-widest mb-1">Total Commandes</div>
          <div className="text-2xl font-black text-text-heading">{allSales.length}</div>
        </div>
        <div className="bg-bg-card border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="text-[0.65rem] font-black text-orange-500 uppercase tracking-widest mb-1">En Attente</div>
          <div className="text-2xl font-black text-orange-500">{allSales.filter(s => s.deliveryStatus === 'pending').length}</div>
        </div>
        <div className="bg-bg-card border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="text-[0.65rem] font-black text-yellow-500 uppercase tracking-widest mb-1">Partielles</div>
          <div className="text-2xl font-black text-yellow-500">{allSales.filter(s => s.deliveryStatus === 'partially_delivered').length}</div>
        </div>
        <div className="bg-bg-card border border-white/5 rounded-2xl p-5 shadow-xl">
          <div className="text-[0.65rem] font-black text-green-500 uppercase tracking-widest mb-1">Totalement Livrées</div>
          <div className="text-2xl font-black text-green-500">{allSales.filter(s => s.deliveryStatus === 'delivered').length}</div>
        </div>
      </div>

      <div className="bg-bg-card border border-white/5 rounded-3xl overflow-hidden shadow-xl no-print">
        <div className="px-8 py-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-text-heading tracking-tight">Suivi des Sorties de Stock</h3>
            <p className="text-text-muted text-sm mt-1">Vérifiez si les magasiniers ont libéré les marchandises pour chaque facture.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text"
                placeholder="Rechercher facture..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              type="primary" 
              icon={<Printer size={16} />}
              onClick={handlePrint}
              className="h-10 rounded-xl font-bold bg-blue-600 border-none"
            >
              Imprimer Non-Livrés
            </Button>
          </div>
        </div>

        <DataTable 
          columns={columns}
          data={filteredSales}
          emptyIcon={Truck}
          emptyTitle="Aucune donnée"
          emptyDescription="L'historique des livraisons apparaîtra ici."
        />
      </div>

      {/* Print Area - Only visible during printing */}
      <div id="print-area" className="print-only">
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '28pt', color: '#000' }}>{companySettings?.name || 'STOCK EXPERT'}</h1>
          <h2 style={{ margin: '10px 0', fontSize: '18pt', color: '#333' }}>Rapport des Factures en Attente de Livraison</h2>
          <p style={{ fontSize: '10pt', color: '#666' }}>Généré le {new Date().toLocaleString()}</p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid #000', padding: '12px' }}>N° Facture</th>
              <th style={{ border: '1px solid #000', padding: '12px' }}>Date</th>
              <th style={{ border: '1px solid #000', padding: '12px' }}>Magasin Vente</th>
              <th style={{ border: '1px solid #000', padding: '12px' }}>Détails des Articles</th>
              <th style={{ border: '1px solid #000', padding: '12px' }}>État Global</th>
            </tr>
          </thead>
          <tbody>
            {nonDeliveredSales.length > 0 ? (
              nonDeliveredSales.map(sale => (
                <tr key={sale.id}>
                  <td style={{ border: '1px solid #000', padding: '12px', fontWeight: 'bold' }}>#{sale.invoiceNumber}</td>
                  <td style={{ border: '1px solid #000', padding: '12px' }}>{new Date(sale.date).toLocaleDateString()}</td>
                  <td style={{ border: '1px solid #000', padding: '12px' }}>{stores.find(s => s.id === sale.storeId)?.name}</td>
                  <td style={{ border: '1px solid #000', padding: '12px' }}>
                    {sale.items.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '9pt', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 'bold' }}>• {item.quantity}x {item.name}</span>
                        <span style={{ marginLeft: '10px', color: item.isDelivered ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
                          [{item.isDelivered ? 'SORTI' : 'EN ATTENTE'}]
                        </span>
                      </div>
                    ))}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '12px', fontWeight: 'bold', textAlign: 'center' }}>
                    {sale.deliveryStatus === 'pending' ? 'EN ATTENTE' : 'PARTIEL'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ border: '1px solid #000', padding: '40px', textAlign: 'center' }}>
                  Aucune facture en attente de livraison.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        <div style={{ marginTop: '50px', fontSize: '9pt', color: '#888', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
          Document officiel généré par le système Stock Expert.
        </div>
      </div>

      <style>
        {`
          .print-only { display: none; }
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white !important; color: black !important; margin: 0; padding: 0; }
            @page { margin: 2cm; }
            #print-area { color: black !important; background: white !important; }
          }
        `}
      </style>
    </div>
  );
};

export default ManagerDeliveries;
