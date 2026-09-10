import React from 'react';

/**
 * Surface de contenu standard.
 *
 * Un écran se compose d'un `Toolbar` (filtres, recherche, actions) PUIS d'un
 * `Panel` séparé pour les données. Les deux ne partagent volontairement pas la
 * même carte : mélanger les commandes et le tableau alourdit la lecture.
 */
const Panel = ({ title, subtitle, actions, icon: Icon, children, noPadding = false, className = '' }) => (
  <section className={`glass-panel rounded-xl overflow-hidden ${className}`}>
    {(title || actions) && (
      <header className="flex items-center gap-2.5 px-4 py-2.5 border-b border-black/5 dark:border-white/10">
        {Icon && <Icon className="text-primary shrink-0" style={{ fontSize: 15 }} />}
        <div className="min-w-0 flex-1">
          {title && <h2 className="text-[0.85rem] font-semibold text-text-heading truncate">{title}</h2>}
          {subtitle && <p className="text-[0.7rem] text-text-muted truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
    )}
    <div className={noPadding ? '' : 'p-4'}>{children}</div>
  </section>
);

export default Panel;
