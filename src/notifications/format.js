/**
 * format.js
 * Mise en forme des notifications, hors composant pour être partagée.
 */

/** « il y a 3 min » plutôt qu'un horodatage : le panneau se lit d'un coup d'œil. */
export const since = (t, iso) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return t('s.a_l_instant');
  if (s < 3600) return t('s.il_y_a_n_min', { n: Math.floor(s / 60) });
  if (s < 86400) return t('s.il_y_a_n_h', { n: Math.floor(s / 3600) });
  return t('s.il_y_a_n_j', { n: Math.floor(s / 86400) });
};
