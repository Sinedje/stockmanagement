/**
 * Catalogue des fonctionnalités activables par entreprise.
 *
 * Une clé absente de `company.features` vaut « activée » : ajouter un module
 * ici ne le retire donc à personne. Chaque entrée liste les sections de
 * navigation qu'elle gouverne, pour que le menu se réduise automatiquement
 * quand le module est coupé.
 */
export const FEATURES = [
  { key: 'inventory',  labelKey: 's.inventaire_physique',
    descriptionKey: 's.comptage_physique_et_ajustement_des_stocks',
    sections: ['inventory'] },
  { key: 'transfers',  labelKey: 's.transferts_inter_magasins_2',
    descriptionKey: 's.envois_et_receptions_de_stock_entre_points_d',
    sections: ['transfers'] },
  { key: 'breakage',   labelKey: 's.casses_reconditionnement',
    descriptionKey: 's.declaration_des_marchandises_endommagees_et_',
    sections: ['breakage'] },
  { key: 'customers',  labelKey: 's.comptes_clients',
    descriptionKey: 's.clients_depots_credits_et_recouvrements',
    sections: ['customers'] },
  { key: 'deliveries', labelKey: 's.suivi_des_livraisons_2',
    descriptionKey: 's.sorties_de_stock_validees_par_les_magasinier',
    sections: ['deliveries'] },
  { key: 'accounting', labelKey: 's.comptabilite_bilans',
    descriptionKey: 's.bilans_de_caisse_transactions_et_mouvements',
    sections: ['financial', 'reports', 'transactions', 'movements', 'summary'] },
];

export const FEATURE_KEYS = FEATURES.map(f => f.key);

/** Une fonctionnalité est active tant qu'elle n'a pas été explicitement coupée. */
export const isFeatureEnabled = (features, key) => features?.[key] !== false;

/** Sections de navigation à masquer d'après les fonctionnalités coupées. */
export const disabledSections = (features) =>
  FEATURES.filter(f => !isFeatureEnabled(features, f.key)).flatMap(f => f.sections);
