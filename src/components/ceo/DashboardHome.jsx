import React, { useMemo, useState } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import StatsCard from '../common/StatsCard';
import Card from '../common/Card';
import DataTable from '../common/DataTable';
import { DollarSign, Package, TrendingUp, Building2, Landmark, AlertTriangle, Briefcase, Calendar, X } from 'lucide-react';

const CEODashboardHome = () => {
  const { allSales, stores, allCashierProducts, versements } = useStore();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const validSales = useMemo(() => {
    let sales = allSales.filter(s => s.status !== 'cancelled');
    if (startDate) sales = sales.filter(s => new Date(s.date) >= new Date(startDate));
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      sales = sales.filter(s => new Date(s.date) <= end);
    }
    return sales;
  }, [allSales, startDate, endDate]);

  const validVersements = useMemo(() => {
    let vList = versements;
    if (startDate) vList = vList.filter(v => new Date(v.date) >= new Date(startDate));
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      vList = vList.filter(v => new Date(v.date) <= end);
    }
    return vList;
  }, [versements, startDate, endDate]);

  // --- Global KPIs ---
  const globalRevenue = validSales.reduce((sum, s) => sum + s.total, 0);
  const globalEstimatedProfit = globalRevenue * 0.25;
  const globalOwed = validSales.reduce((sum, s) => sum + (s.amountDue || 0), 0);
  const globalStockValue = allCashierProducts.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const globalVersements = validVersements.reduce((sum, v) => sum + v.amount, 0);

  // --- Store Breakdown ---
  const storeStats = stores.map(store => {
    const sProducts = allCashierProducts.filter(p => p.storeId === store.id);
    const sSales = validSales.filter(s => s.storeId === store.id);
    const sVersements = validVersements.filter(v => v.storeId === store.id);
    const stockValue = sProducts.reduce((sum, p) => sum + (p.cost * p.stock), 0);
    const revenue = sSales.reduce((sum, s) => sum + s.total, 0);
    const totalVersements = sVersements.reduce((sum, v) => sum + v.amount, 0);
    const profit = revenue * 0.25;
    return { id: store.id, name: store.name, stockValue, revenue, totalVersements, profit };
  });

  const storeColumns = [
    { key: 'name', title: 'Magasin', render: (val) => <span className="font-bold text-text-heading">{val}</span> },
    { key: 'revenue', title: "Chiffre d'Affaires", render: (val) => <span className="text-green-500 font-semibold">{formatPrice(val)}</span> },
    { key: 'profit', title: 'Bénéfice Estimé', render: (val) => <span className="text-emerald-500">{formatPrice(val)}</span> },
    { key: 'totalVersements', title: 'Total Versements', render: (val) => <span className="text-blue-500">{formatPrice(val)}</span> },
    { key: 'stockValue', title: 'Valeur du Stock', render: (val) => <span className="text-purple-500">{formatPrice(val)}</span> },
  ];

  // --- Product Performance (Full Catalog) ---
  const allProductStats = useMemo(() => {
    const stats = allCashierProducts.map(p => ({
      id: p.id,
      name: p.name,
      storeName: p.storeName,
      stock: p.stock,
      image: p.image || '',
      quantitySold: 0,
      revenue: 0,
    }));

    validSales.forEach(sale => {
      sale.items.forEach(item => {
        let stat = stats.find(s => s.id === item.productId);
        if (!stat) stat = stats.find(s => s.name === item.name);
        if (stat) {
          stat.quantitySold += item.quantity;
          stat.revenue += item.quantity * item.price;
        }
      });
    });

    return [...stats].sort((a, b) => b.quantitySold - a.quantitySold);
  }, [allCashierProducts, validSales]);

  const productColumns = [
    {
      key: 'name',
      title: 'Produit',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-black/5 dark:border-white/5 flex items-center justify-center"
            style={{ background: row.image ? 'transparent' : 'rgba(0,0,0,0.05)' }}
          >
            {row.image ? (
              <img src={row.image} alt={val} className="w-full h-full object-cover" />
            ) : (
              <Package size={16} className="opacity-20 text-text-muted" />
            )}
          </div>
          <div>
            <div className="font-semibold text-text-heading">{val}</div>
            <div className="text-[0.65rem] opacity-50 uppercase tracking-wider">{row.storeName}</div>
          </div>
        </div>
      ),
    },
    { key: 'quantitySold', title: 'Qté Vendue', render: (val) => <span className="font-black">{val}</span> },
    { key: 'revenue', title: 'Revenu', render: (val) => <span className="text-primary font-bold">{formatPrice(val)}</span> },
    { key: 'stock', title: 'Stock Restant', render: (val) => <span className="opacity-70">{val}</span> },
  ];

  return (
    <div className="animate-fade-in space-y-8">

      {/* Date Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg-secondary p-5 rounded-2xl border border-white/5 shadow-sm">
        <div className="flex items-center gap-3 text-primary">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider">Période d'Analyse</h3>
            <p className="text-[0.65rem] text-text-muted">Filtrez les ventes et versements par date</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-bg-primary border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all flex-1 sm:flex-none"
          />
          <span className="text-text-muted font-bold text-xs uppercase">au</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-bg-primary border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm font-medium focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all flex-1 sm:flex-none"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="ml-2 px-4 py-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-wider border border-red-500/20"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Global Financials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={DollarSign} label="Chiffre d'Affaires Global" value={formatPrice(globalRevenue)} color="green" accentColor="#10b981" />
        <StatsCard icon={Briefcase} label="Bénéfice Net Estimé" value={formatPrice(globalEstimatedProfit)} color="emerald" accentColor="#059669" />
        <StatsCard icon={Package} label="Valeur Totale du Stock" value={formatPrice(globalStockValue)} color="purple" accentColor="#8b5cf6" />
        <StatsCard icon={AlertTriangle} label="Créances (Argent Dehors)" value={formatPrice(globalOwed)} color="red" accentColor="#ef4444" changeDir="down" change={globalOwed > 0 ? 'À recouvrir' : 'Sain'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard icon={Landmark} label="Total des Versements" value={formatPrice(globalVersements)} color="blue" accentColor="#3b82f6" />
        <StatsCard icon={Building2} label="Nombre de Magasins" value={stores.length} color="indigo" accentColor="#6366f1" />
      </div>

      {/* Store Comparison */}
      <Card title="Performance par Magasin" icon={Building2} noPadding>
        <div className="bg-bg-secondary rounded-xl overflow-hidden border border-white/5">
          <DataTable columns={storeColumns} data={storeStats} compact />
        </div>
      </Card>

      {/* Product Analytics */}
      <Card title="Performance du Catalogue Complet" icon={TrendingUp} noPadding>
        <div className="bg-bg-secondary rounded-xl overflow-hidden border border-white/5">
          <div className="px-5 py-2.5 border-b border-white/5 flex items-center gap-2">
            <span className="text-[0.65rem] text-text-muted opacity-60 italic">
              💡 Cliquez sur un article pour voir sa fiche produit
            </span>
          </div>
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            <DataTable
              columns={productColumns}
              data={allProductStats}
              compact
              emptyTitle="Aucune donnée"
              onRowClick={record => setSelectedProduct(record)}
            />
          </div>
        </div>
      </Card>

      {/* ── Product Image Modal ── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="relative w-full max-w-sm"
            style={{ animation: 'ceoZoomIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center font-black transition-all border"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.18)',
                color: 'rgba(255,255,255,0.7)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)'; e.currentTarget.style.color = '#f87171'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              <X size={15} strokeWidth={2.5} />
            </button>

            {/* Card */}
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(160deg, rgba(28,28,42,0.98) 0%, rgba(16,16,26,0.99) 100%)',
                border: '1px solid rgba(255,255,255,0.09)',
              }}
            >
              {/* Image area */}
              <div className="relative w-full h-52 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.92) saturate(1.05)' }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3" style={{ opacity: 0.18 }}>
                    <Package size={60} strokeWidth={1} color="white" />
                    <span className="text-white text-[0.6rem] uppercase tracking-widest font-black">Aucune image</span>
                  </div>
                )}
                {/* Bottom gradient */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-24"
                  style={{ background: 'linear-gradient(to top, rgba(16,16,26,0.99) 0%, transparent 100%)' }}
                />
                {/* Product name overlaid on image */}
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                  <h3 className="text-white font-black text-lg leading-tight tracking-tight drop-shadow-lg">
                    {selectedProduct.name}
                  </h3>
                  <p
                    className="text-[0.68rem] uppercase tracking-widest font-bold mt-0.5"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                  >
                    {selectedProduct.storeName}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div
                className="grid grid-cols-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                {[
                  { label: 'Qté Vendue', value: selectedProduct.quantitySold, color: 'rgba(255,255,255,0.9)', large: true },
                  { label: 'Revenu', value: formatPrice(selectedProduct.revenue), color: '#4ade80', large: false },
                  {
                    label: 'Stock',
                    value: selectedProduct.stock,
                    color: selectedProduct.stock <= 5 ? '#f87171' : '#a78bfa',
                    large: true,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center py-5 px-2 gap-1"
                    style={{
                      borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    }}
                  >
                    <span
                      className="text-[0.58rem] uppercase tracking-widest font-black"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {stat.label}
                    </span>
                    <span
                      className={`font-black ${stat.large ? 'text-2xl' : 'text-base'}`}
                      style={{ color: stat.color }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                className="px-5 py-3 text-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span
                  className="text-[0.58rem] uppercase tracking-widest"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  Cliquez à l'extérieur pour fermer
                </span>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes ceoZoomIn {
              from { opacity: 0; transform: scale(0.84) translateY(12px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default CEODashboardHome;
