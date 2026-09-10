import { useT } from '../../i18n/I18nContext';
import React from 'react';
import { InboxOutlined, ShopOutlined } from '@ant-design/icons';
import { formatPrice } from '../../context/StoreContext';

/**
 * Vignette catalogue — l'image occupe l'essentiel de la carte.
 *
 * L'ancienne version reléguait la photo à une pastille de 56 px au milieu du
 * texte ; ici elle prend toute la largeur en 4:3, et seules les informations
 * indispensables (nom, prix, stock) l'accompagnent.
 */
const ProductGridCard = ({ product, onZoom }) => {
  const t = useT();
  const low = product.stock <= 5 || product.physicalStock <= 5;

  return (
    <article className="glass-panel rounded-xl p-4 overflow-hidden group flex flex-col transition-colors hover:border-primary/25">
      <div
        className={`relative w-full aspect-[4/3] overflow-hidden bg-black/5 dark:bg-white/5 ${product.image ? 'cursor-zoom-in' : ''}`}
        onClick={() => product.image && onZoom?.({ url: product.image, name: product.designation || product.name })}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.designation || product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted opacity-25">
            <InboxOutlined style={{ fontSize: 34 }} />
          </div>
        )}

        {product.category && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/55 text-white text-[0.6rem] font-medium backdrop-blur-sm">
            {product.category}
          </span>
        )}
        {low && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-500 text-white text-[0.6rem] font-semibold">
            {t('s.stock_bas')}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-[0.82rem] font-semibold text-text-heading leading-snug line-clamp-2" title={product.designation || product.name}>
          {product.designation || product.name}
        </h3>

        <p className="text-[0.68rem] text-text-muted flex items-center gap-1 truncate">
          <ShopOutlined style={{ fontSize: 10 }} />
          {product.storeName}
        </p>

        <div className="mt-auto pt-2 flex items-end justify-between gap-2 border-t border-black/5 dark:border-white/10">
          <span className="text-[0.9rem] font-bold text-primary tabular-nums whitespace-nowrap">
            {formatPrice(product.price)}
          </span>
          <span className="text-[0.68rem] text-text-muted tabular-nums text-right leading-tight">
            <span className={product.stock <= 5 ? 'text-red-500 font-semibold' : ''}>{product.stock}</span>
            {' / '}
            <span className={product.physicalStock <= 5 ? 'text-red-500 font-semibold' : ''}>{product.physicalStock}</span>
            <span className="block text-[0.58rem] opacity-70">{t('s.theo_phys')}</span>
          </span>
        </div>
      </div>
    </article>
  );
};

export default ProductGridCard;
