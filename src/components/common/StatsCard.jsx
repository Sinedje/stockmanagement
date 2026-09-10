import React from 'react';

/**
 * Indicateur de tableau de bord — volontairement sobre : une pastille d'icône
 * discrète, un libellé, une valeur dominante. L'accent colore l'icône plutôt
 * qu'une bordure épaisse, pour que la valeur reste l'élément le plus lisible.
 */
const StatsCard = ({ icon: Icon, label, value, change, changeDir, accentColor }) => {
  const tint = accentColor || 'var(--color-primary)';

  return (
    <div className="glass-panel rounded-xl p-3.5 flex items-start gap-3 transition-colors duration-200 hover:border-black/10 dark:hover:border-white/15">
      {Icon && (
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `color-mix(in srgb, ${tint} 12%, transparent)`, color: tint }}
        >
          <Icon style={{ fontSize: 16 }} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="text-[0.68rem] font-medium text-text-muted uppercase tracking-wide leading-snug truncate" title={label}>
          {label}
        </div>
        <div className="text-[1.15rem] font-bold text-text-heading tracking-tight tabular-nums leading-tight mt-1 truncate">
          {value}
        </div>
        {change !== undefined && (
          <div
            className={`text-[0.68rem] font-medium mt-1 truncate ${
              changeDir === 'down' ? 'text-red-500' : 'text-text-muted'
            }`}
          >
            {change}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
