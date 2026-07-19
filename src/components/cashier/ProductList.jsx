import React, { useState, useMemo } from 'react';
import { useStore, formatPrice } from '../../context/StoreContext';
import { Package, Search, Filter, SortAsc, LayoutGrid, List as ListIcon, Store } from 'lucide-react';

const ProductList = () => {
  const { allCashierProducts, stores, categories, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('Tous');
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'category'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [zoomedImage, setZoomedImage] = useState(null);

  const filteredAndSortedProducts = useMemo(() => {
    let result = (allCashierProducts || []).filter(p => {
      const name = p.name || '';
      const category = p.category || '';
      const matchSearch = name.toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                          category.toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchStore = selectedStore === 'Tous' || p.storeId === parseInt(selectedStore);
      return matchSearch && matchStore;
    });

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'category') {
      result.sort((a, b) => a.category.localeCompare(b.category));
    }

    return result;
  }, [allCashierProducts, searchTerm, selectedStore, sortBy]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls Bar */}
      <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-start">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50" />
          <input
            className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-[0.9rem] text-text-heading placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-all"
            placeholder="Rechercher un article ou catégorie..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Store Filter */}
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2">
            <Store size={16} className="text-primary opacity-70" />
            <select 
              className="bg-transparent border-none text-[0.8rem] font-bold text-text-heading focus:outline-none cursor-pointer"
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value)}
            >
              <option value="Tous">Tous les magasins</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Sort Toggle */}
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-black uppercase tracking-widest transition-all ${sortBy === 'name' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
            >
              Nom A-Z
            </button>
            <button 
              onClick={() => setSortBy('category')}
              className={`px-3 py-1.5 rounded-lg text-[0.7rem] font-black uppercase tracking-widest transition-all ${sortBy === 'category' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
            >
              Catégorie
            </button>
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
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedProducts.map(product => (
            <div key={product.id} className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all group">
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
              
              <h3 className="text-base font-black text-text-heading mb-1 truncate tracking-tight">{product.name}</h3>
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
          ))}
        </div>
      ) : (
        <div className="bg-bg-card border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted w-16"></th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Article</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Catégorie</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Magasin</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Prix</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Stock Théorique</th>
                <th className="px-6 py-4 text-[0.65rem] font-black uppercase tracking-widest text-text-muted">Stock Physique</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredAndSortedProducts.map(product => (
                <tr key={product.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-3">
                    <div 
                      className={`w-10 h-10 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center ${product.image ? 'cursor-zoom-in hover:border-primary/50' : ''}`}
                      onClick={() => product.image && setZoomedImage({ url: product.image, name: product.name })}
                    >
                      {product.image ? (
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={16} className="opacity-20" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-text-heading">{product.name}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredAndSortedProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 opacity-40 gap-4">
          <Package size={48} strokeWidth={1.5} className="text-text-muted" />
          <p className="text-text-secondary font-semibold">Aucun article trouvé</p>
        </div>
      )}

      {/* Image Zoom Modal Overlay */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-10 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full flex flex-col items-center gap-4">
            <div className="bg-white/10 p-2 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
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
        </div>
      )}
    </div>
  );
};

export default ProductList;
