import { useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 20;

/**
 * Découpe une liste en pages pour les tableaux écrits à la main
 * (`Table` pagine déjà de son côté via Ant Design).
 *
 * La page revient à 1 dès que la taille de la liste change — filtre, recherche,
 * suppression — sinon l'utilisateur resterait sur une page devenue vide.
 * Le recalage se fait pendant le rendu plutôt que dans un effet, pour éviter
 * un second rendu en cascade.
 */
export const usePagination = (items = [], pageSize = DEFAULT_PAGE_SIZE) => {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const [page, setPage] = useState(1);
  const [seenTotal, setSeenTotal] = useState(total);

  if (seenTotal !== total) {
    setSeenTotal(total);
    setPage(1);
  }

  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  return { page: safePage, setPage, pageCount, total, pageSize, pageItems };
};

export default usePagination;
