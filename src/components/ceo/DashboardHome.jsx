import { useT } from '../../i18n/I18nContext';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatPrice } from '../../context/StoreContext';
import { estimateProfit, ESTIMATED_MARGIN_LABEL } from '../../utils/businessRules';
import { useSales, useStores, useUsers } from '../../hooks';
import StatsCard from '../common/StatsCard';
import Widget, { WidgetRow, makeNavigator } from '../common/Widget';
import DateField from '../common/DateField';
import { BankOutlined, CalendarOutlined, CloseOutlined, DollarOutlined, InboxOutlined, ProjectOutlined, RiseOutlined, WarningOutlined } from '@ant-design/icons';

const CEODashboardHome = ({ onNavigate, availableTabs }) => {
  const t = useT();
  const go = makeNavigator(onNavigate, availableTabs);
  const { allSales, versements } = useSales();
  const { stores } = useStores();
  const { allCashierProducts } = useUsers();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modale : fermeture au clavier et blocage du défilement de l'arrière-plan.
  useEffect(() => {
    if (!selectedProduct) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') setSelectedProduct(null); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedProduct]);

  // Bornes de la période, recalculées une seule fois par changement de filtre.
  const range = useMemo(() => ({
    from: startDate ? new Date(startDate) : null,
    to: endDate ? (() => { const d = new Date(endDate); d.setHours(23, 59, 59, 999); return d; })() : null,
  }), [startDate, endDate]);

  const validSales = useMemo(() => allSales.filter(s => {
    if (s.status === 'cancelled') return false;
    const d = new Date(s.date);
    return (!range.from || d >= range.from) && (!range.to || d <= range.to);
  }), [allSales, range]);

  const validVersements = useMemo(() => versements.filter(v => {
    const d = new Date(v.date);
    return (!range.from || d >= range.from) && (!range.to || d <= range.to);
  }), [versements, range]);

  // --- Indicateurs globaux ---
  const globalRevenue = validSales.reduce((sum, s) => sum + s.total, 0);
  const globalEstimatedProfit = estimateProfit(globalRevenue);
  const globalOwed = validSales.reduce((sum, s) => sum + (s.amountDue || 0), 0);
  const globalStockValue = allCashierProducts.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const globalVersements = validVersements.reduce((sum, v) => sum + v.amount, 0);

  // --- Magasins, triés par chiffre d'affaires : le widget n'en montre que les premiers ---
  const storeStats = useMemo(() => stores
    .map(store => {
      const revenue = validSales.filter(s => s.storeId === store.id).reduce((sum, s) => sum + s.total, 0);
      const stockValue = allCashierProducts
        .filter(p => p.storeId === store.id)
        .reduce((sum, p) => sum + (p.cost * p.stock), 0);
      return { id: store.id, name: store.name, revenue, stockValue };
    })
    .sort((a, b) => b.revenue - a.revenue), [stores, validSales, allCashierProducts]);

  // --- Meilleures ventes du catalogue ---
  const topProducts = useMemo(() => {
    const stats = new Map();
    allCashierProducts.forEach(p => stats.set(p.id, {
      id: p.id, name: p.name, storeName: p.storeName, stock: p.stock,
      image: p.image || '', quantitySold: 0, revenue: 0,
    }));
    validSales.forEach(sale => sale.items.forEach(item => {
      const stat = stats.get(item.productId)
        || [...stats.values()].find(s => s.name === item.name);
      if (stat) {
        stat.quantitySold += item.quantity;
        stat.revenue += item.quantity * item.price;
      }
    }));
    return [...stats.values()]
      .filter(s => s.quantitySold > 0)
      .sort((a, b) => b.quantitySold - a.quantitySold);
  }, [allCashierProducts, validSales]);

  const lowStock = useMemo(
    () => allCashierProducts.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock),
    [allCashierProducts]
  );

  return (
    <div className="animate-fade-in space-y-5">

      {/* Période d'analyse */}
      <div className="glass-panel rounded-xl p-4 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2.5 text-text-secondary shrink-0">
          <CalendarOutlined style={{ fontSize: 15 }} className="text-primary" />
          <span className="text-[0.78rem] font-semibold">{t('s.periode_d_analyse')}</span>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
          <DateField value={startDate} onChange={setStartDate} placeholder={t('s.du')} className="flex-1 sm:flex-none" />
          <span className="text-text-muted text-[0.72rem]">au</span>
          <DateField value={endDate} onChange={setEndDate} placeholder={t('s.au')} className="flex-1 sm:flex-none" />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="px-2.5 py-1.5 rounded-lg text-[0.72rem] font-semibold text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Quatre indicateurs clés — le reste vit dans les pages dédiées */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard icon={DollarOutlined} label={t('s.chiffre_d_affaires')} value={formatPrice(globalRevenue)} accentColor="#10b981" />
        <StatsCard icon={ProjectOutlined} label={`Bénéfice estimé (${ESTIMATED_MARGIN_LABEL})`} value={formatPrice(globalEstimatedProfit)} accentColor="#059669" />
        <StatsCard icon={InboxOutlined} label={t('s.valeur_du_stock')} value={formatPrice(globalStockValue)} accentColor="#8b5cf6" />
        <StatsCard icon={WarningOutlined} label={t('s.creances')} value={formatPrice(globalOwed)} accentColor="#ef4444" changeDir={globalOwed > 0 ? 'down' : 'up'} change={globalOwed > 0 ? 'À recouvrer' : 'Sain'} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StatsCard icon={BankOutlined} label={t('s.total_des_versements')} value={formatPrice(globalVersements)} accentColor="#3b82f6" />
        <StatsCard icon={BankOutlined} label={t('s.magasins')} value={stores.length} accentColor="#6366f1" />
      </div>

      {/* Aperçus courts : 5 lignes maximum, le détail est sur la page dédiée */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Widget
          title={t('s.magasins_les_plus_performants')} icon={BankOutlined} accentColor="#6366f1"
          items={storeStats}
          onSeeMore={go('stores')} seeMoreLabel={t('s.tous_les_magasins')}
          emptyText={t('s.aucun_magasin')}
          renderItem={(s) => (
            <WidgetRow label={s.name} sub={`Stock : ${formatPrice(s.stockValue)}`}
              value={formatPrice(s.revenue)} valueClassName="text-primary" />
          )}
        />

        <Widget
          title={t('s.meilleures_ventes')} icon={RiseOutlined} accentColor="#10b981"
          items={topProducts}
          onSeeMore={go('articles')} seeMoreLabel={t('s.tout_le_catalogue')}
          emptyText={t('s.aucune_vente_sur_la_periode')}
          renderItem={(p) => (
            <button onClick={() => setSelectedProduct(p)} className="w-full text-left">
              <WidgetRow label={p.name} sub={`${p.storeName} · ${p.quantitySold} vendus`}
                value={formatPrice(p.revenue)} valueClassName="text-primary" />
            </button>
          )}
        />

        <Widget
          title={t('s.stock_critique')} icon={WarningOutlined} accentColor="#ef4444"
          items={lowStock}
          onSeeMore={go('inventory')} seeMoreLabel={t('s.voir_l_inventaire')}
          emptyText={t('s.aucun_article_en_alerte')}
          renderItem={(p) => (
            <WidgetRow label={p.name} sub={p.storeName}
              value={`${p.stock} restants`} valueClassName="text-red-500" />
          )}
        />
      </div>

      {/* ── Fiche produit ──
          Rendue via un portail sur <body> : un ancêtre animé par `.animate-fade-in`
          conserve `transform: translateY(0)` (fill forwards), et un ancêtre transformé
          devient le bloc conteneur des enfants `position: fixed`. Sans portail, la
          surcouche était ancrée à ce bloc et non au viewport. */}
      {selectedProduct && createPortal(
        <div
          role="dialog" aria-modal="true" aria-label={selectedProduct.name}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
          onClick={() => setSelectedProduct(null)}
        >
          <div className="relative w-full max-w-xs animate-modal-in" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedProduct(null)} aria-label={t('s.fermer')}
              className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center
                         bg-bg-secondary text-text-secondary border border-black/10 dark:border-white/15
                         shadow-lg hover:bg-red-500 hover:text-white hover:border-transparent transition-colors"
            >
              <CloseOutlined style={{ fontSize: 14 }} />
            </button>

            <div className="glass-panel-strong rounded-xl overflow-hidden shadow-2xl">
              <div className="relative w-full h-40 overflow-hidden bg-black/5 dark:bg-black/30">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted opacity-40">
                    <InboxOutlined style={{ fontSize: 40 }} />
                  </div>
                )}
              </div>

              <div className="px-4 pt-3 pb-2.5 border-b border-black/5 dark:border-white/10">
                <h3 className="text-text-heading font-semibold text-[0.95rem] leading-tight">{selectedProduct.name}</h3>
                <p className="text-text-muted text-[0.7rem] mt-0.5">{selectedProduct.storeName}</p>
              </div>

              <div className="grid grid-cols-3 divide-x divide-black/5 dark:divide-white/10">
                {[
                  { label: 'Vendus', value: selectedProduct.quantitySold, cls: 'text-text-heading' },
                  { label: 'Revenu', value: formatPrice(selectedProduct.revenue), cls: 'text-primary' },
                  { label: t('s.stock'), value: selectedProduct.stock, cls: selectedProduct.stock <= 5 ? 'text-red-500' : 'text-text-heading' },
                ].map(stat => (
                  <div key={stat.label} className="flex flex-col items-center justify-center py-3 px-1.5 gap-0.5">
                    <span className="text-[0.6rem] uppercase tracking-wide text-text-muted">{stat.label}</span>
                    <span className={`font-bold text-[0.95rem] tabular-nums text-center ${stat.cls}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CEODashboardHome;
