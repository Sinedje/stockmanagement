import React, { useState } from 'react';
import { formatPrice } from '../../context/StoreContext';
import { useUsers, useProducts, useSales, useStores } from '../../hooks';
import SearchComponent from '../common/SearchComponent';
import { Store } from 'lucide-react';

const ProductGrid = () => {
  const { allCashierProducts } = useUsers();
  const { categories } = useProducts();
  const { addToCart } = useSales();
  const { stores } = useStores();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Tous');
  const [filterStore, setFilterStore] = useState('Tous');

  const filtered = allCashierProducts.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'Tous' || p.category === filterCat;
    const matchStore = filterStore === 'Tous' || p.storeId === filterStore;
    return matchSearch && matchCat && matchStore;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Barre de filtres */}
      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <SearchComponent
            placeholder="Rechercher un produit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            width="100%"
            className="max-w-md"
          />
        </div>

        {/* Filtre par magasin */}
        {stores.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-text-muted opacity-60 mr-1">
              <Store size={12} strokeWidth={2.5} />
              <span className="text-[0.65rem] font-black uppercase tracking-widest">Magasin</span>
            </div>
            {['Tous', ...stores.map(s => s.id)].map(val => {
              const label = val === 'Tous' ? 'Tous' : stores.find(s => s.id === val)?.name;
              return (
                <button
                  key={val}
                  className={`px-3 py-1 rounded-lg text-[0.75rem] font-bold transition-all duration-200
                    ${filterStore === val
                      ? 'bg-primary text-black shadow-lg shadow-primary/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-white/5'}`}
                  onClick={() => setFilterStore(val)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Filtre par catégorie */}
        <div className="flex flex-wrap gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
          {['Tous', ...categories].map(cat => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-lg text-[0.8rem] font-bold transition-all duration-200
                ${filterCat === cat
                  ? 'bg-primary text-black shadow-lg shadow-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}
              onClick={() => setFilterCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map(product => (
          <div
            key={`${product.id}-${product.storeId}`}
            className={`group relative p-4 bg-bg-secondary rounded-2xl border border-white/5 cursor-pointer
              transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1
              ${product.stock <= 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
            onClick={() => addToCart(product)}
          >
            {/* Badge magasin (si plusieurs magasins) */}
            {stores.length > 1 && (
              <div className="flex items-center gap-1 mb-1">
                <Store size={9} className="text-primary opacity-60" />
                <span className="text-[0.58rem] font-black text-primary uppercase tracking-widest opacity-60 truncate">
                  {product.storeName}
                </span>
              </div>
            )}

            <div className="text-[0.65rem] font-black text-primary uppercase tracking-widest mb-1 opacity-60 group-hover:opacity-100 transition-opacity">
              {product.category}
            </div>
            <div className="text-[0.95rem] font-bold text-text-heading mb-3 line-clamp-2 h-10">
              {product.name}
            </div>
            <div className="flex items-end justify-between mt-auto">
              <div className="text-lg font-black text-primary tracking-tight">
                {formatPrice(product.price)}
              </div>
              <div className="text-[0.7rem] font-bold bg-white/5 px-2 py-1 rounded-md border border-white/5">
                <span className="text-text-muted mr-1">Stock:</span>
                <span className={product.stock <= product.minStock ? 'text-red-500' : 'text-primary'}>
                  {product.stock}
                </span>
              </div>
            </div>
            {product.stock <= 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                <span className="bg-red-500 text-white text-[0.7rem] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                  Épuisé
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
