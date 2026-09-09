import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { formatPrice } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useUsers, useStores } from '../../hooks';
import { Package, Search, LayoutGrid, List as ListIcon, Store, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';

const ProductList = () => {
  const { currentUser } = useAuth();
  const { allCashierProducts } = useUsers();
  const { stores } = useStores();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('Tous');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc', 'name_desc', 'category', 'stock_asc', 'stock_desc', 'physical_asc', 'physical_desc'
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const [zoomedImage, setZoomedImage] = useState(null);

  // Build unique categories from products
  const allCategories = useMemo(() => {
    const cats = new Set((allCashierProducts || []).map(p => p.category).filter(Boolean));
    return ['Toutes', ...Array.from(cats).sort((a, b) => a.localeCompare(b))];
  }, [allCashierProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = (allCashierProducts || []).filter(p => {
      const name = p.name || '';
      const designation = p.designation || '';
      const category = p.category || '';
      const term = (searchTerm || '').toLowerCase();
      const matchSearch = name.toLowerCase().includes(term) ||
                          designation.toLowerCase().includes(term) ||
                          category.toLowerCase().includes(term);
      const pStoreId = String(p.storeId?._id || p.storeId?.id || p.storeId);
      const sStoreId = String(selectedStore?._id || selectedStore?.id || selectedStore);
      const matchStore = selectedStore === 'Tous' || pStoreId === sStoreId;
      const matchCategory = selectedCategory === 'Toutes' || p.category === selectedCategory;
      return matchSearch && matchStore && matchCategory;
    });

    if (sortBy === 'name_asc') {
      result.sort((a, b) => (a.designation || a.name).localeCompare(b.designation || b.name));
    } else if (sortBy === 'name_desc') {
      result.sort((a, b) => (b.designation || b.name).localeCompare(a.designation || a.name));
    } else if (sortBy === 'category') {
      result.sort((a, b) => {
        const catCompare = (a.category || '').localeCompare(b.category || '');
        if (catCompare !== 0) return catCompare;
        return (a.designation || a.name).localeCompare(b.designation || b.name);
      });
    } else if (sortBy === 'stock_asc') {
      result.sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
    } else if (sortBy === 'physical_asc') {
      result.sort((a, b) => (a.physicalStock ?? 0) - (b.physicalStock ?? 0));
    } else if (sortBy === 'physical_desc') {
      result.sort((a, b) => (b.physicalStock ?? 0) - (a.physicalStock ?? 0));
    }

    return result;
  }, [allCashierProducts, searchTerm, selectedStore, selectedCategory, sortBy]);

  // Group by category when sortBy === 'category'
  const groupedProducts = useMemo(() => {
    if (sortBy !== 'category') return null;
    const groups = {};
    for (const p of filteredAndSortedProducts) {
      const cat = p.category || 'Sans catégorie';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [filteredAndSortedProducts, sortBy]);

  const ProductCard = ({ product }) => (
    <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-14 h-14 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform ${product.image ? 'cursor-zoom-in' : ''}`}
          onClick={() => product.image && setZoomedImage({ url: product.image, name: product.name })}
        >
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={24} className="opacity-20" />
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-primary tracking-tight">{formatPrice(product.price)}</div>
          <div className="text-[0.6rem] font-black text-text-muted uppercase tracking-widest opacity-50">{product.category}</div>
        </div>
      </div>

      <h3 className="text-base font-black text-text-heading mb-1 truncate tracking-tight" title={product.designation || product.name}>{product.designation || product.name}</h3>
      <div className="flex items-center gap-1 text-[0.7rem] text-text-muted font-bold mb-4 opacity-70">
        <Store size={12} className="text-primary" />
        {product.storeName}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
        <div className="flex flex-col">
          <span className="text-[0.55rem] font-black text-text-muted uppercase tracking-widest">Théorique (Vente)</span>
          <span className={`text-base font-black ${product.stock <= 5 ? 'text-red-500' : 'text-text-heading'}`}>
            {product.stock}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[0.55rem] font-black text-text-muted uppercase tracking-widest">Physique (Magasin)</span>
          <span className={`text-base font-black ${product.physicalStock <= 5 ? 'text-red-500' : 'text-primary'}`}>
            {product.physicalStock}
          </span>
        </div>
      </div>
      {(product.stock <= 5 || product.physicalStock <= 5) && (
        <div className="mt-2 px-2 py-1 rounded-md bg-red-500/10 text-red-500 text-[0.55rem] font-black uppercase tracking-tighter text-center animate-pulse">
          Attention Stock Bas
        </div>
      )}
    </div>
  );

  const ProductRow = ({ product }) => (
    <tr className="hover:bg-primary/5 transition-colors group">
      <td className="px-6 py-3">
        <div
          className={`w-10 h-10 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center ${product.image ? 'cursor-zoom-in hover:border-primary/50' : ''}`}
          onClick={() => product.image && setZoomedImage({ url: product.image, name: product.designation || product.name })}
        >
          {product.image ? (
            <img src={product.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <Package size={16} className="opacity-20" />
          )}
        </div>
      </td>
      <td className="px-6 py-4 font-bold text-text-heading">
        <div>{product.designation || product.name}</div>
        {product.designation && product.name !== product.designation && (
          <div className="text-[0.7rem] text-text-muted font-normal">Réf: {product.name}</div>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[0.65rem] font-black uppercase tracking-widest">
          {product.category}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-text-secondary font-medium">
        <div className="flex items-center gap-1.5">
          <Store size={14} className="text-primary opacity-50" />
          {product.storeName}
        </div>
      </td>
      <td className="px-6 py-4 font-bold text-primary">{formatPrice(product.price)}</td>
      <td className="px-6 py-4">
        <span className={`font-black ${product.stock <= 5 ? 'text-red-500' : 'text-text-heading'}`}>
          {product.stock}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`font-black ${product.physicalStock <= 5 ? 'text-red-500' : 'text-primary'}`}>
          {product.physicalStock}
        </span>
      </td>
    </tr>
  );

  const SortButton = ({ value, label }) => {
    const isActive = sortBy === value;
    return (
      <button
        onClick={() => setSortBy(value)}
        className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${isActive ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
      >
        {value === 'name_asc' && <ChevronUp size={12} />}
        {value === 'name_desc' && <ChevronDown size={12} />}
        {value === 'category' && <ArrowUpDown size={12} />}
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls Bar */}
      <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50" />
          <input
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-[0.9rem] text-text-heading placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-all"
            placeholder="Rechercher un article..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2">
            <Package size={15} className="text-primary opacity-70 shrink-0" />
            <select
              className="bg-transparent border-none text-[0.8rem] font-bold text-text-heading focus:outline-none cursor-pointer max-w-[160px]"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Store Filter */}
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2">
            <Store size={15} className="text-primary opacity-70 shrink-0" />
            <select
              className="bg-transparent border-none text-[0.8rem] font-bold text-text-heading focus:outline-none cursor-pointer"
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value)}
            >
              <option value="Tous">Tous les magasins</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-1">
            <SortButton value="name_asc" label="Nom A-Z" />
            <SortButton value="name_desc" label="Nom Z-A" />
            <SortButton value="category" label="Catégorie" />
            <SortButton value="stock_asc" label="Qté ↑" />
            <SortButton value="stock_desc" label="Qté ↓" />
            <SortButton value="physical_asc" label="Phys ↑" />
            <SortButton value="physical_desc" label="Phys ↓" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-bg-secondary text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-bg-secondary text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {/* Result Count */}
        <div className="ml-auto text-[0.75rem] font-bold text-text-muted whitespace-nowrap">
          {filteredAndSortedProducts.length} article{filteredAndSortedProducts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Products Display */}
      {groupedProducts ? (
        // Grouped by category view
        <div className="space-y-8">
          {Object.entries(groupedProducts).map(([catName, catProducts]) => (
            <div key={catName}>
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[0.7rem] font-black uppercase tracking-widest border border-primary/20">
                  {catName} <span className="opacity-60 ml-1">({catProducts.length})</span>
                </span>
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {catProducts.map(product => <ProductCard key={product.id} product={product} />)}
                </div>
              ) : (
                <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                        <th className="px-6 py-3 text-[0.65rem] font-black uppercase tracking-widest text-text-muted w-16"></th>
                        <th className="px-6 py-3 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Article</th>
                        <th className="px-6 py-3 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Catégorie</th>
                        <th className="px-6 py-3 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Magasin</th>
                        <th className="px-6 py-3 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Prix</th>
                        <th className="px-6 py-3 text-[0.65rem] font-black uppercase tracking-widest text-text-muted cursor-pointer hover:text-primary select-none" onClick={() => setSortBy(sortBy === 'stock_asc' ? 'stock_desc' : 'stock_asc')}>
                          Stock Théorique {sortBy === 'stock_asc' ? '↑' : sortBy === 'stock_desc' ? '↓' : <span className="opacity-30">⇅</span>}
                        </th>
                        <th className="px-6 py-3 text-[0.65rem] font-black uppercase tracking-widest text-text-muted cursor-pointer hover:text-primary select-none" onClick={() => setSortBy(sortBy === 'physical_asc' ? 'physical_desc' : 'physical_asc')}>
                          Stock Physique {sortBy === 'physical_asc' ? '↑' : sortBy === 'physical_desc' ? '↓' : <span className="opacity-30">⇅</span>}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {catProducts.map(product => <ProductRow key={product.id} product={product} />)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedProducts.map(product => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted w-16"></th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted cursor-pointer hover:text-primary" onClick={() => setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc')}>
                  Article {sortBy === 'name_asc' ? '↑' : sortBy === 'name_desc' ? '↓' : ''}
                </th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted cursor-pointer hover:text-primary" onClick={() => setSortBy('category')}>
                  Catégorie {sortBy === 'category' ? '↑' : ''}
                </th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Magasin</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Prix</th>
                <th
                  className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted cursor-pointer hover:text-primary select-none"
                  onClick={() => setSortBy(sortBy === 'stock_asc' ? 'stock_desc' : 'stock_asc')}
                >
                  Stock Théorique {sortBy === 'stock_asc' ? '↑' : sortBy === 'stock_desc' ? '↓' : <span className="opacity-30">⇅</span>}
                </th>
                <th
                  className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted cursor-pointer hover:text-primary select-none"
                  onClick={() => setSortBy(sortBy === 'physical_asc' ? 'physical_desc' : 'physical_asc')}
                >
                  Stock Physique {sortBy === 'physical_asc' ? '↑' : sortBy === 'physical_desc' ? '↓' : <span className="opacity-30">⇅</span>}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredAndSortedProducts.map(product => <ProductRow key={product.id} product={product} />)}
            </tbody>
          </table>
        </div>
      )}

      {filteredAndSortedProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 opacity-40 gap-4">
          <Package size={48} strokeWidth={1.5} className="text-text-muted" />
          <p className="text-text-secondary font-semibold">Aucun article trouvé</p>
          {selectedCategory !== 'Toutes' && (
            <button className="text-primary text-sm font-bold underline" onClick={() => setSelectedCategory('Toutes')}>
              Effacer le filtre catégorie
            </button>
          )}
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-10 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
          style={{ animation: 'fade-in 0.3s ease-out' }}
        >
          <div className="relative max-w-4xl max-h-full flex flex-col items-center gap-4">
            <div className="bg-white/10 p-2 rounded-2xl shadow-2xl overflow-hidden" style={{ animation: 'zoom-in 0.3s ease-out' }}>
              <img
                src={zoomedImage.url}
                alt={zoomedImage.name}
                className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
              />
            </div>
            <div className="text-center">
              <h4 className="text-white text-2xl font-black tracking-tight">{zoomedImage.name}</h4>
              <p className="text-white/50 text-sm">Cliquez n'importe où pour fermer</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProductList;


