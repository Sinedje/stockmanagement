/**
 * Hypothèses métier partagées par les tableaux de bord.
 *
 * ATTENTION — `ESTIMATED_MARGIN_RATE` est un taux forfaitaire, pas une marge calculée.
 * Les bénéfices affichés valent `chiffre d'affaires × ce taux` : ils ignorent le coût
 * d'achat réel de chaque article, les remises et les casses. C'est une estimation
 * indicative, à ne pas utiliser comme chiffre comptable.
 *
 * Pour une marge réelle, il faudrait calculer par ligne de vente :
 *   somme((prix_vente - cout_achat) × quantité)
 * Le coût d'achat est déjà disponible sur les produits (`p.cost`).
 */
export const ESTIMATED_MARGIN_RATE = 0.25;

/** Bénéfice estimé (forfaitaire) à partir d'un chiffre d'affaires. */
export const estimateProfit = (revenue) => revenue * ESTIMATED_MARGIN_RATE;

/** Libellé du taux, pour indiquer l'hypothèse à l'écran. */
export const ESTIMATED_MARGIN_LABEL = `${Math.round(ESTIMATED_MARGIN_RATE * 100)}%`;
