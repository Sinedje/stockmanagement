import React from 'react';
import { ArrowRightOutlined } from '@ant-design/icons';

export const MAX_WIDGET_ROWS = 5;

/**
 * Fabrique les gestionnaires « Voir plus ».
 *
 * Un même tableau de bord est monté par plusieurs rôles dont les menus diffèrent
 * (la vue stratégique sert au PDG, au gestionnaire et au comptable). Renvoyer
 * `undefined` quand l'onglet visé n'existe pas sur la page courante évite un
 * bouton qui mènerait à un écran vide — le widget masque alors simplement le lien.
 */
export const makeNavigator = (onNavigate, availableTabs) => (tabId) =>
  onNavigate && (!availableTabs || availableTabs.includes(tabId))
    ? () => onNavigate(tabId)
    : undefined;

/**
 * Widget de tableau de bord : un aperçu court, jamais une liste complète.
 *
 * Il n'affiche au maximum que `max` lignes (5 par défaut) ; au-delà, un bouton
 * « Voir plus » renvoie vers la page qui contient la liste entière. Les lignes sont
 * une simple grille libellé / valeur : pas de défilement horizontal possible.
 */
const Widget = ({
  title,
  icon: Icon,
  accentColor,
  items = [],
  renderItem,
  max = MAX_WIDGET_ROWS,
  onSeeMore,
  seeMoreLabel = 'Voir plus',
  emptyText = 'Aucune donnée',
  className = '',
}) => {
  const shown = items.slice(0, max);
  const hidden = Math.max(0, items.length - shown.length);
  const tint = accentColor || 'var(--color-primary)';

  return (
    <section className={`glass-panel rounded-xl flex flex-col overflow-hidden ${className}`}>
      <header className="flex items-center gap-2.5 px-4 py-3 border-b border-black/5 dark:border-white/10">
        {Icon && (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `color-mix(in srgb, ${tint} 12%, transparent)`, color: tint }}
          >
            <Icon style={{ fontSize: 15 }} />
          </span>
        )}
        <h3 className="text-[0.85rem] font-semibold text-text-heading tracking-tight truncate">{title}</h3>
        {items.length > 0 && (
          <span className="ml-auto shrink-0 text-[0.68rem] font-medium text-text-muted tabular-nums">
            {items.length}
          </span>
        )}
      </header>

      {shown.length === 0 ? (
        <p className="px-4 py-8 text-center text-[0.78rem] text-text-muted">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {shown.map((item, i) => (
            <li key={item.id ?? i} className="px-4 py-2.5">
              {renderItem(item, i)}
            </li>
          ))}
        </ul>
      )}

      {onSeeMore && items.length > 0 && (
        <button
          onClick={onSeeMore}
          className="mt-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-[0.72rem] font-semibold
                     text-primary border-t border-black/5 dark:border-white/10
                     hover:bg-primary/5 transition-colors group"
        >
          {hidden > 0 ? `${seeMoreLabel} (${hidden})` : seeMoreLabel}
          <ArrowRightOutlined style={{ fontSize: 13 }} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </section>
  );
};

/** Ligne standard : libellé (+ sous-titre) à gauche, valeur à droite. */
export const WidgetRow = ({ label, sub, value, valueClassName = 'text-text-heading' }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <div className="text-[0.8rem] font-medium text-text-primary truncate">{label}</div>
      {sub && <div className="text-[0.68rem] text-text-muted truncate mt-0.5">{sub}</div>}
    </div>
    <div className={`text-[0.82rem] font-semibold tabular-nums whitespace-nowrap shrink-0 ${valueClassName}`}>
      {value}
    </div>
  </div>
);

export default Widget;
