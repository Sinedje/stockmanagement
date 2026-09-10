import React from 'react';

/**
 * Barre de commandes d'un écran : recherche, filtres, bascules de vue, actions.
 *
 * Volontairement séparée du `Panel` qui affiche les données — c'est la demande
 * explicite de ne plus enfermer un tableau et ses filtres dans la même carte.
 */
const Toolbar = ({ children, right, className = '' }) => (
  <div className={`glass-panel rounded-xl px-3 py-2.5 flex flex-wrap items-center gap-2 ${className}`}>
    {children}
    {right && <div className="ml-auto flex items-center gap-2 shrink-0">{right}</div>}
  </div>
);

export default Toolbar;
