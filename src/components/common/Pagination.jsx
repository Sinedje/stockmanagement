import { useT } from '../../i18n/I18nContext';
import React from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

/** Contrôles de pagination. Le découpage est fait par `usePagination` (src/hooks). */
const Pagination = ({ page, pageCount, total, pageSize, onChange, label = 'éléments' }) => {
  const t = useT();
  if (pageCount <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Fenêtre de pages autour de la page courante, pour ne pas afficher 40 boutons.
  const windowed = [];
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  for (let i = start; i < start + 5 && i <= pageCount; i += 1) windowed.push(i);

  const btn = 'w-7 h-7 rounded-lg text-[0.72rem] font-medium flex items-center justify-center transition-colors disabled:opacity-35 disabled:cursor-not-allowed';

  return (
    <nav
      aria-label={t('s.pagination')}
      className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-t border-black/5 dark:border-white/10"
    >
      <p className="text-[0.72rem] text-text-muted tabular-nums">
        {from}–{to} sur {total} {label}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label={t('s.page_precedente')}
          className={`${btn} text-text-secondary hover:bg-black/5 dark:hover:bg-white/10`}
        >
          <LeftOutlined style={{ fontSize: 14 }} />
        </button>

        {windowed.map(n => (
          <button
            key={n} onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={`${btn} ${n === page
              ? 'bg-primary/10 text-primary border border-primary/25'
              : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/10'}`}
          >
            {n}
          </button>
        ))}

        <button
          onClick={() => onChange(page + 1)} disabled={page >= pageCount} aria-label={t('s.page_suivante')}
          className={`${btn} text-text-secondary hover:bg-black/5 dark:hover:bg-white/10`}
        >
          <RightOutlined style={{ fontSize: 14 }} />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
