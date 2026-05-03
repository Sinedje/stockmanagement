import React from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import StatsCard from '../common/StatsCard';
import Card from '../common/Card';
import DataTable from '../common/DataTable';
import { Package, DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

const DashboardHome = () => {
  const { products, sales, totalRevenue, todaySales, todayRevenue, lowStockProducts, totalStockValue } = useStore();

  const recentSales = sales.slice(0, 8);
  const totalProfit = sales.reduce((sum, s) => sum + s.total * 0.25, 0);

  const salesColumns = [
    { key: 'date', title: 'Date', render: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'items', title: 'Articles', render: (val) => <span className="text-[0.8rem] opacity-70">{val.length} articles</span> },
    { key: 'total', title: 'Total', render: (val) => <span className="font-bold text-primary">{formatPrice(val)}</span> },
    { key: 'paymentMethod', title: 'Paiement', render: (val) => <span className={`badge ${val === 'Espèces' ? 'badge-success' : 'badge-info'}`}>{val}</span> },
  ];

  const alertColumns = [
    { key: 'name', title: 'Produit', render: (val) => <span className="font-semibold text-text-heading">{val}</span> },
    { key: 'stock', title: 'Stock', render: (val) => <span className={`font-black ${val <= 5 ? 'text-red-500' : 'text-amber-500'}`}>{val}</span> },
    { key: 'minStock', title: 'Minimum' },
    { key: 'status', title: 'État', render: (_, row) => <span className={`badge ${row.stock <= 5 ? 'badge-danger' : 'badge-warning'}`}>{row.stock <= 5 ? 'Critique' : 'Bas'}</span> },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Package} label="Total Produits" value={products.length} color="blue" accentColor="#3b82f6" change="+3" />
        <StatsCard icon={DollarSign} label="Revenu Total" value={formatPrice(totalRevenue)} color="green" accentColor="#10b981" change="+12%" />
        <StatsCard icon={ShoppingCart} label="Ventes Aujourd'hui" value={todaySales.length} color="purple" accentColor="#8b5cf6" change={formatPrice(todayRevenue)} />
        <StatsCard icon={AlertTriangle} label="Stock Faible" value={lowStockProducts.length} color="red" accentColor="#ef4444" changeDir="down" change="Alerte" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ventes Récentes" icon={Clock} noPadding>
          <div className="bg-bg-secondary rounded-xl overflow-hidden border border-white/5">
            <DataTable columns={salesColumns} data={recentSales} compact emptyTitle="Aucune vente" emptyDescription="Aucune vente enregistrée." />
          </div>
        </Card>

        <Card title="Alertes Stock" icon={AlertTriangle} noPadding>
          <div className="bg-bg-secondary rounded-xl overflow-hidden border border-white/5">
            <DataTable
              columns={alertColumns}
              data={lowStockProducts}
              compact
              emptyIcon={Package}
              emptyTitle="Aucune alerte"
              emptyDescription="Tous les produits sont bien approvisionnés."
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatsCard icon={TrendingUp} label="Bénéfice Estimé" value={formatPrice(totalProfit)} color="green" accentColor="#10b981" />
        <StatsCard icon={Package} label="Valeur du Stock" value={formatPrice(totalStockValue)} color="blue" accentColor="#3b82f6" />
      </div>
    </div>
  );
};

export default DashboardHome;
