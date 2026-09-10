import { useT } from '../../i18n/I18nContext';
import React, { useMemo } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { estimateProfit, ESTIMATED_MARGIN_LABEL } from '../../utils/businessRules';
import { useProducts, useSales, useStores, useUsers } from '../../hooks';
import StatsCard from '../common/StatsCard';
import Widget, { WidgetRow, makeNavigator } from '../common/Widget';
import { CarOutlined, ClockCircleOutlined, CreditCardOutlined, DollarOutlined, HomeOutlined, InboxOutlined, RiseOutlined, ShoppingCartOutlined, WarningOutlined } from '@ant-design/icons';

const DashboardHome = ({ onNavigate, availableTabs }) => {
  const t = useT();
  const go = makeNavigator(onNavigate, availableTabs);
  const { products, lowStockProducts } = useProducts();
  const { sales, allSales, totalRevenue, todaySales, todayRevenue } = useSales();
  const { stores } = useStores();
  const { allCashierProducts } = useUsers();

  const pendingDeliveries = useMemo(
    () => allSales.filter(s => s.status !== 'cancelled' && s.deliveryStatus !== 'delivered'),
    [allSales]
  );
  const totalUnpaid = allSales.reduce((sum, s) => sum + (s.amountDue || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + estimateProfit(s.total), 0);

  const storeValues = useMemo(() => stores
    .map(store => ({
      id: store.id,
      name: store.name,
      value: allCashierProducts
        .filter(p => p.storeId === store.id)
        .reduce((sum, p) => sum + (p.cost * p.stock), 0),
    }))
    .sort((a, b) => b.value - a.value), [stores, allCashierProducts]);

  return (
    <div className="animate-fade-in space-y-5">
      {/* Quatre indicateurs clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard icon={DollarOutlined} label={t('s.revenu_total')} value={formatPrice(totalRevenue)} accentColor="#10b981" />
        <StatsCard icon={ShoppingCartOutlined} label={t('s.ventes_aujourd_hui')} value={todaySales.length} accentColor="#8b5cf6" change={formatPrice(todayRevenue)} />
        <StatsCard icon={InboxOutlined} label={t('s.produits_au_catalogue')} value={products.length} accentColor="#3b82f6" />
        <StatsCard icon={WarningOutlined} label={t('s.stock_faible')} value={lowStockProducts.length} accentColor="#ef4444" changeDir={lowStockProducts.length > 0 ? 'down' : 'up'} change={lowStockProducts.length > 0 ? 'À réapprovisionner' : 'Sain'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatsCard icon={CarOutlined} label={t('s.livraisons_en_attente')} value={pendingDeliveries.length} accentColor="#f97316" changeDir={pendingDeliveries.length > 0 ? 'down' : 'up'} change={pendingDeliveries.length > 0 ? 'À traiter' : 'Tout livré'} />
        <StatsCard icon={CreditCardOutlined} label={t('s.creances_en_attente')} value={formatPrice(totalUnpaid)} accentColor="#ef4444" changeDir="down" change="À recouvrer" />
        <StatsCard icon={RiseOutlined} label={`Bénéfice estimé (${ESTIMATED_MARGIN_LABEL})`} value={formatPrice(totalProfit)} accentColor="#10b981" />
      </div>

      {/* Aperçus courts : 5 lignes maximum chacun */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget
          title={t('s.ventes_recentes')} icon={ClockCircleOutlined} accentColor="#8b5cf6"
          items={sales}
          onSeeMore={go('sales')} seeMoreLabel={t('s.historique_complet')}
          emptyText={t('s.aucune_vente_enregistree')}
          renderItem={(s) => (
            <WidgetRow
              label={new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              sub={`${s.items.length} article${s.items.length > 1 ? 's' : ''} · ${s.paymentMethod || '—'}`}
              value={formatPrice(s.total)} valueClassName="text-primary"
            />
          )}
        />

        <Widget
          title={t('s.alertes_stock')} icon={WarningOutlined} accentColor="#ef4444"
          items={lowStockProducts}
          onSeeMore={go('inventory')} seeMoreLabel={t('s.voir_l_inventaire')}
          emptyText={t('s.tous_les_produits_sont_approvisionnes')}
          renderItem={(p) => (
            <WidgetRow label={p.name} sub={`Minimum : ${p.minStock}`}
              value={`${p.stock} restants`}
              valueClassName={p.stock <= 5 ? 'text-red-500' : 'text-amber-500'} />
          )}
        />

        <Widget
          title={t('s.valeur_du_stock_par_magasin')} icon={HomeOutlined} accentColor="#3b82f6"
          items={storeValues}
          onSeeMore={go('stores')} seeMoreLabel={t('s.tous_les_magasins')}
          emptyText={t('s.aucun_magasin')}
          renderItem={(s) => (
            <WidgetRow label={s.name} sub="Au prix d'achat"
              value={formatPrice(s.value)} valueClassName="text-primary" />
          )}
        />
      </div>
    </div>
  );
};

export default DashboardHome;
