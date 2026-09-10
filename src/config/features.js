/**
 * Catalogue des fonctionnalités activables par entreprise.
 *
 * Une clé absente de `company.features` vaut « activée » : ajouter un module
 * ici ne le retire donc à personne. Chaque entrée liste les sections de
 * navigation qu'elle gouverne, pour que le menu se réduise automatiquement
 * quand le module est coupé.
 */
export const FEATURES = [
  { key: 'inventory',  label: 'Inventaire physique',
    description: 'Comptage physique et ajustement des stocks.',
    sections: ['inventory'] },
  { key: 'transfers',  label: 'Transferts inter-magasins',
    description: 'Envois et réceptions de stock entre points de vente.',
    sections: ['transfers'] },
  { key: 'breakage',   label: 'Casses & reconditionnement',
    description: 'Déclaration des marchandises endommagées et remise en sacs.',
    sections: ['breakage'] },
  { key: 'customers',  label: 'Comptes clients',
    description: 'Clients, dépôts, crédits et recouvrements.',
    sections: ['customers'] },
  { key: 'deliveries', label: 'Suivi des livraisons',
    description: 'Sorties de stock validées par les magasiniers.',
    sections: ['deliveries'] },
  { key: 'accounting', label: 'Comptabilité & bilans',
    description: 'Bilans de caisse, transactions et mouvements.',
    sections: ['financial', 'reports', 'transactions', 'movements', 'summary'] },
];

export const FEATURE_KEYS = FEATURES.map(f => f.key);

/** Une fonctionnalité est active tant qu'elle n'a pas été explicitement coupée. */
export const isFeatureEnabled = (features, key) => features?.[key] !== false;

/** Sections de navigation à masquer d'après les fonctionnalités coupées. */
export const disabledSections = (features) =>
  FEATURES.filter(f => !isFeatureEnabled(features, f.key)).flatMap(f => f.sections);
