import React from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales, useProducts } from '../../hooks';
import StatsCard from '../common/StatsCard';
import Card from '../common/Card';
import { DollarSign, TrendingUp, ShoppingCart, Package, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';

const FinancialSummary = () => {
  const { totalRevenue, todayRevenue, todaySales, sales } = useSales();
  const { totalStockValue, products } = useProducts();

  const totalCost = sales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.productId);
      return itemSum + (product ? product.cost * item.quantity : 0);
    }, 0);
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  const last7Days = sales.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  });
  const revenue7d = last7Days.reduce((s, sale) => s + sale.total, 0);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={DollarSign} label="Revenu Total" value={formatPrice(totalRevenue)} color="green" accentColor="#10b981" change="+12%" />
        <StatsCard icon={TrendingUp} label="Bénéfice Net" value={formatPrice(totalProfit)} color="green" accentColor="#22c55e" change={`${margin}% marge`} />
        <StatsCard icon={ShoppingCart} label="Revenu Aujourd'hui" value={formatPrice(todayRevenue)} color="blue" accentColor="#3b82f6" change={`${todaySales.length} ventes`} />
        <StatsCard icon={Package} label="Valeur du Stock" value={formatPrice(totalStockValue)} color="purple" accentColor="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Résumé Financier" icon={BarChart3}>
          <div className="space-y-4">
            {[
              { label: 'Chiffre d\'affaires total', value: formatPrice(totalRevenue), color: 'text-primary', icon: ArrowUpRight, iconColor: '#10b981' },
              { label: 'Coût total des marchandises', value: formatPrice(totalCost), color: 'text-red-500', icon: ArrowDownRight, iconColor: '#ef4444' },
              { label: 'Bénéfice brut', value: formatPrice(totalProfit), color: 'text-primary', icon: ArrowUpRight, iconColor: '#10b981' },
              { label: 'Revenu 7 derniers jours', value: formatPrice(revenue7d), color: 'text-blue-500', icon: TrendingUp, iconColor: '#3b82f6' },
              { label: 'Nombre total de ventes', value: sales.length, color: 'text-purple-500', icon: ShoppingCart, iconColor: '#8b5cf6' },
              { label: 'Marge bénéficiaire', value: `${margin}%`, color: 'text-primary', icon: TrendingUp, iconColor: '#10b981' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <row.icon size={14} style={{ color: row.iconColor }} />
                  </div>
                  <span className="text-[0.85rem] text-text-secondary font-medium">{row.label}</span>
                </div>
                <span className={`text-[0.95rem] font-black ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Ventes par Catégorie" icon={TrendingUp}>
          <div className="space-y-6 py-2">
            {(() => {
              const catSales = {};
              sales.forEach(s => {
                s.items.forEach(item => {
                  const product = products.find(p => p.id === item.productId);
                  if (product) {
                    catSales[product.category] = (catSales[product.category] || 0) + item.price * item.quantity;
                  }
                });
              });
              const sortedCats = Object.entries(catSales).sort((a, b) => b[1] - a[1]);
              const maxVal = Math.max(...Object.values(catSales), 1);
              
              if (sortedCats.length === 0) return <div className="text-center text-text-muted py-8 italic">Aucune donnée de vente disponible.</div>;

              return sortedCats.map(([cat, val]) => (
                <div key={cat} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[0.85rem] font-bold text-text-heading group-hover:text-primary transition-colors">{cat}</span>
                    <span className="text-[0.85rem] font-black text-primary">{formatPrice(val)}</span>
                  </div>
                  <div className="h-2.5 bg-black/30 rounded-full border border-white/5 overflow-hidden p-[2px]">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary-dark via-primary to-primary-light shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000 ease-out" 
                      style={{ width: `${(val / maxVal) * 100}%` }} 
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinancialSummary;
