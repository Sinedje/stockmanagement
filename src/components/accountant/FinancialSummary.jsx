import { useT } from '../../i18n/I18nContext';
import React, { useMemo, useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useSales, useProducts } from '../../hooks';
import StatsCard from '../common/StatsCard';
import Widget, { WidgetRow, makeNavigator } from '../common/Widget';
import { BarChartOutlined, DollarOutlined, GroupOutlined, InboxOutlined, RiseOutlined, ShoppingCartOutlined } from '@ant-design/icons';

const FinancialSummary = ({ onNavigate, availableTabs }) => {
  const t = useT();
  const go = makeNavigator(onNavigate, availableTabs);
  const { totalRevenue, todayRevenue, todaySales, sales } = useSales();
  const { totalStockValue, products } = useProducts();

  // Marge réelle : basée sur le coût d'achat de chaque article vendu.
  const totalCost = useMemo(() => sales.reduce((sum, s) =>
    sum + s.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.productId);
      return itemSum + (product ? product.cost * item.quantity : 0);
    }, 0), 0), [sales, products]);

  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Horodatage figé au montage : lire l'heure pendant le rendu rendrait celui-ci impur.
  const [mountedAt] = useState(() => Date.now());
  const revenue7d = useMemo(() => {
    const cutoff = mountedAt - 7 * 24 * 60 * 60 * 1000;
    return sales.filter(s => new Date(s.date).getTime() >= cutoff).reduce((sum, s) => sum + s.total, 0);
  }, [sales, mountedAt]);

  // Récapitulatif : cinq lignes, comme les autres widgets.
  const summaryRows = [
    { id: 'ca', label: t('s.chiffre_d_affaires_total'), value: formatPrice(totalRevenue), cls: 'text-primary' },
    { id: 'cost', label: t('s.cout_des_marchandises'), value: formatPrice(totalCost), cls: 'text-red-500' },
    { id: 'profit', label: t('s.benefice_brut'), value: formatPrice(totalProfit), cls: 'text-primary' },
    { id: 'r7', label: 'Revenu 7 derniers jours', value: formatPrice(revenue7d), cls: 'text-blue-500' },
    { id: 'count', label: t('s.nombre_de_ventes'), value: sales.length, cls: 'text-text-heading' },
  ];

  const categoryRows = useMemo(() => {
    const byCategory = new Map();
    sales.forEach(s => s.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return;
      const key = product.category || 'Sans catégorie';
      byCategory.set(key, (byCategory.get(key) || 0) + item.price * item.quantity);
    }));
    return [...byCategory.entries()]
      .map(([name, value]) => ({ id: name, name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sales, products]);

  const maxCategory = categoryRows[0]?.value || 1;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard icon={DollarOutlined} label={t('s.revenu_total')} value={formatPrice(totalRevenue)} accentColor="#10b981" />
        <StatsCard icon={RiseOutlined} label={t('s.benefice_net')} value={formatPrice(totalProfit)} accentColor="#22c55e" change={`${margin} % de marge`} />
        <StatsCard icon={ShoppingCartOutlined} label={t('s.revenu_aujourd_hui')} value={formatPrice(todayRevenue)} accentColor="#3b82f6" change={`${todaySales.length} vente${todaySales.length > 1 ? 's' : ''}`} />
        <StatsCard icon={InboxOutlined} label={t('s.valeur_du_stock')} value={formatPrice(totalStockValue)} accentColor="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Widget
          title={t('s.recapitulatif_financier')} icon={BarChartOutlined} accentColor="#10b981"
          items={summaryRows}
          onSeeMore={go('transactions')} seeMoreLabel={t('s.voir_les_transactions')}
          renderItem={(row) => <WidgetRow label={row.label} value={row.value} valueClassName={row.cls} />}
        />

        <Widget
          title={t('s.ventes_par_categorie')} icon={GroupOutlined} accentColor="#3b82f6"
          items={categoryRows}
          onSeeMore={go('movements')} seeMoreLabel={t('s.mouvements_de_stock')}
          emptyText={t('s.aucune_donnee_de_vente')}
          renderItem={(c) => (
            <div>
              <WidgetRow label={c.name} value={formatPrice(c.value)} valueClassName="text-primary" />
              <div className="h-1 mt-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(c.value / maxCategory) * 100}%` }} />
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default FinancialSummary;
