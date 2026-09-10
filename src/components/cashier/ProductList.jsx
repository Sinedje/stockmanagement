import { useT } from '../../i18n/I18nContext';
import React, { useMemo, useState } from 'react';
import { AppstoreOutlined, UnorderedListOutlined, InboxOutlined, ShopOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import { formatPrice } from '../../context/StoreContext';
import { useUsers, useStores } from '../../hooks';
import { Toolbar, Panel, Table, SearchInput, Select } from '../ui';
import ProductGridCard from '../catalog/ProductGridCard';
import ImageZoom from '../catalog/ImageZoom';

// Construit à l'appel : les libellés dépendent de la langue courante.
const sortOptions = (t) => [
  { value: 'name_asc', label: t('s.nom_a_z') },
  { value: 'name_desc', label: t('s.nom_z_a') },
  { value: 'category', label: t('s.categorie') },
  { value: 'stock_asc', label: t('s.stock_theorique') },
  { value: 'stock_desc', label: t('s.stock_theorique_2') },
  { value: 'physical_asc', label: t('s.stock_physique_2') },
  { value: 'physical_desc', label: t('s.stock_physique_3') },
];

const SORTERS = {
  name_asc: (a, b) => (a.designation || a.name).localeCompare(b.designation || b.name),
  name_desc: (a, b) => (b.designation || b.name).localeCompare(a.designation || a.name),
  category: (a, b) => (a.category || '').localeCompare(b.category || '')
    || (a.designation || a.name).localeCompare(b.designation || b.name),
  stock_asc: (a, b) => (a.stock ?? 0) - (b.stock ?? 0),
  stock_desc: (a, b) => (b.stock ?? 0) - (a.stock ?? 0),
  physical_asc: (a, b) => (a.physicalStock ?? 0) - (b.physicalStock ?? 0),
  physical_desc: (a, b) => (b.physicalStock ?? 0) - (a.physicalStock ?? 0),
};

const ProductList = () => {
  const t = useT();
  const { allCashierProducts } = useUsers();
  const { stores } = useStores();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('Tous');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [sortBy, setSortBy] = useState('name_asc');
  const [viewMode, setViewMode] = useState('list');
  const [zoomedImage, setZoomedImage] = useState(null);

  const categoryOptions = useMemo(() => {
    const cats = new Set((allCashierProducts || []).map(p => p.category).filter(Boolean));
    return ['Toutes', ...[...cats].sort((a, b) => a.localeCompare(b))].map(c => ({ value: c, label: c }));
  }, [allCashierProducts]);

  const storeOptions = useMemo(
    () => [{ value: 'Tous', label: t('s.tous_les_magasins') }, ...(stores || []).map(s => ({ value: s.id, label: s.name }))],
    [stores]
  );

  const products = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = (allCashierProducts || []).filter(p => {
      const matchSearch = !term
        || (p.name || '').toLowerCase().includes(term)
        || (p.designation || '').toLowerCase().includes(term)
        || (p.category || '').toLowerCase().includes(term);
      const pStoreId = String(p.storeId?._id || p.storeId?.id || p.storeId);
      const matchStore = selectedStore === 'Tous' || pStoreId === String(selectedStore);
      const matchCategory = selectedCategory === 'Toutes' || p.category === selectedCategory;
      return matchSearch && matchStore && matchCategory;
    });
    return result.sort(SORTERS[sortBy] || SORTERS.name_asc);
  }, [allCashierProducts, searchTerm, selectedStore, selectedCategory, sortBy]);

  const columns = [
    {
      key: 'designation',
      title: t('s.article'),
      render: (_, p) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-9 h-9 rounded-md overflow-hidden shrink-0 bg-black/5 dark:bg-white/5 flex items-center justify-center ${p.image ? 'cursor-zoom-in' : ''}`}
            onClick={(e) => { e.stopPropagation(); p.image && setZoomedImage({ url: p.image, name: p.designation || p.name }); }}
          >
            {p.image
              ? <img src={p.image} alt="" loading="lazy" className="w-full h-full object-cover" />
              : <InboxOutlined className="text-text-muted opacity-40" style={{ fontSize: 14 }} />}
          </span>
          <span className="min-w-0">
            <span className="block text-[0.8rem] font-medium text-text-heading truncate" title={p.designation || p.name}>
              {p.designation || p.name}
            </span>
            <span className="block text-[0.66rem] text-text-muted truncate">{p.reference || p.name}</span>
          </span>
        </div>
      ),
    },
    { key: 'category', title: t('s.categorie'), render: (v) => <span className="text-[0.72rem] text-text-secondary">{v || '—'}</span> },
    {
      key: 'storeName', title: t('s.magasin'),
      render: (v) => (
        <span className="text-[0.72rem] text-text-secondary flex items-center gap-1 whitespace-nowrap">
          <ShopOutlined style={{ fontSize: 10 }} className="text-primary" />{v}
        </span>
      ),
    },
    { key: 'price', title: t('s.prix'), align: 'right', render: (v) => <span className="text-[0.78rem] font-semibold text-primary tabular-nums whitespace-nowrap">{formatPrice(v)}</span> },
    { key: 'stock', title: t('s.theorique'), align: 'right', render: (v) => <span className={`tabular-nums ${v <= 5 ? 'text-red-500 font-semibold' : ''}`}>{v}</span> },
    { key: 'physicalStock', title: t('s.physique'), align: 'right', render: (v) => <span className={`tabular-nums ${v <= 5 ? 'text-red-500 font-semibold' : ''}`}>{v}</span> },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      {/* Commandes — carte distincte de celle des données */}
      <Toolbar
        right={
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'list', icon: <UnorderedListOutlined /> },
              { value: 'grid', icon: <AppstoreOutlined /> },
            ]}
          />
        }
      >
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder={t('s.rechercher_un_article')} width={220} />
        <Select value={selectedCategory} onChange={setSelectedCategory} options={categoryOptions} width={160} />
        <Select value={selectedStore} onChange={setSelectedStore} options={storeOptions} width={175} />
        <Select value={sortBy} onChange={setSortBy} options={sortOptions(t)} width={175} />
        <span className="text-[0.72rem] text-text-muted tabular-nums pl-1">{products.length} articles</span>
      </Toolbar>

      {/* Données */}
      {viewMode === 'grid' ? (
        <GridView products={products} onZoom={setZoomedImage} />
      ) : (
        <Panel noPadding>
          <Table
            columns={columns}
            data={products}
            rowKey="id"
            emptyIcon={InboxOutlined}
            emptyTitle={t('s.aucun_article')}
            emptyDescription={t('s.aucun_article_ne_correspond_a_ces_filtres')}
          />
        </Panel>
      )}

      <ImageZoom image={zoomedImage} onClose={() => setZoomedImage(null)} />
    </div>
  );
};

/** Vue vignettes, paginée comme le tableau pour ne pas rendre 368 images d'un coup. */
const GridView = ({ products, onZoom }) => {
  const t = useT();
  const PAGE = 24;
  const [shown, setShown] = useState(PAGE);
  const visible = products.slice(0, shown);

  if (products.length === 0) {
    return (
      <Panel>
        <p className="py-10 text-center text-[0.8rem] text-text-muted">{t('s.aucun_article_ne_correspond_a_ces_filtres')}</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {visible.map(p => <ProductGridCard key={p.id} product={p} onZoom={onZoom} />)}
      </div>
      {shown < products.length && (
        <button
          onClick={() => setShown(s => s + PAGE)}
          className="w-full py-2.5 rounded-xl glass-panel text-[0.78rem] font-semibold text-primary hover:bg-primary/5 transition-colors"
        >
          Afficher plus ({products.length - shown} restants)
        </button>
      )}
    </div>
  );
};

export default ProductList;
