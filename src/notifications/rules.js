/**
 * rules.js
 * Ce que chaque rôle doit savoir, et comment le lui dire.
 *
 * Une notification n'a de valeur que si elle appelle une action. Un magasinier
 * n'a rien à faire d'une dépense enregistrée par la comptabilité, et un
 * comptable n'a pas à être interrompu par chaque vente du comptoir. Chaque rôle
 * ne reçoit donc que les tables qui le concernent — et c'est aussi ce qui évite
 * qu'un poste de caisse passe sa journée à traiter des messages inutiles.
 */

/** Tables suivies par rôle. Une table absente n'est pas écoutée du tout. */
export const TABLES_BY_ROLE = {
  superadmin:  ['companies', 'profiles', 'audit_log'],
  ceo:         ['sales', 'transfers', 'stock_entries', 'breakages', 'profiles', 'versements'],
  manager:     ['sales', 'transfers', 'stock_entries', 'breakages', 'profiles'],
  accountant:  ['versements', 'expenses', 'cash_reports', 'sales'],
  cashier:     ['transfers', 'sales'],
  storekeeper: ['transfers', 'stock_entries'],
};

/** Page vers laquelle mène la notification, quand il y a quelque chose à voir. */
const TARGET = {
  companies: 'companies', profiles: 'users', audit_log: 'audit',
  sales: 'sales', transfers: 'transfers', stock_entries: 'stock_entry',
  breakages: 'breakage', versements: 'versements', expenses: 'financial',
  cash_reports: 'summary',
};

/**
 * Transforme un changement de base en phrase lisible.
 *
 * Renvoie `null` quand l'événement n'apprend rien : une mise à jour technique,
 * une ligne sans nom. Mieux vaut ne rien afficher qu'un message vide, qui
 * apprend au lecteur à ignorer la cloche.
 */
export const describeEvent = (t, { table, event, row, old }, { currentUserId } = {}) => {
  const src = row || old || {};
  const label = src.name || src.username || src.invoiceNumber || src.reference || '';

  // Ne pas se notifier de ses propres actions : l'utilisateur vient de les faire.
  if (src.cashier && currentUserId && src.cashierId === currentUserId) return null;

  switch (table) {
    case 'companies':
      return { tone: 'blue', target: TARGET[table], text:
        event === 'INSERT' ? t('s.entreprise_creee_name', { name: label })
        : event === 'DELETE' ? t('s.entreprise_supprimee_name', { name: label })
        : t('s.entreprise_modifiee_name', { name: label }) };

    case 'profiles':
      if (event === 'UPDATE') return null;   // un simple horodatage de connexion
      return { tone: 'blue', target: TARGET[table], text:
        event === 'INSERT' ? t('s.nouveau_compte_name', { name: label })
        : t('s.compte_supprime_name', { name: label }) };

    case 'audit_log':
      if (event !== 'INSERT') return null;
      return { tone: 'default', target: TARGET[table],
        text: `${src.action || ''}${src.companyName ? ` — ${src.companyName}` : ''}`.trim() };

    case 'sales':
      if (event === 'INSERT') return { tone: 'green', target: TARGET[table], text: t('s.nouvelle_vente_ref', { ref: label }) };
      if (event === 'UPDATE' && src.status === 'cancelled')
        return { tone: 'red', target: TARGET[table], text: t('s.vente_annulee_ref', { ref: label }) };
      return null;

    case 'transfers':
      if (event === 'INSERT') return { tone: 'blue', target: TARGET[table], text: t('s.transfert_envoye_ref', { ref: label }) };
      if (event === 'UPDATE' && src.status === 'completed')
        return { tone: 'green', target: TARGET[table], text: t('s.transfert_receptionne_ref', { ref: label }) };
      return null;

    case 'stock_entries':
      return event === 'INSERT'
        ? { tone: 'green', target: TARGET[table], text: t('s.entree_de_stock_fournisseur', { name: src.supplier || '—' }) }
        : null;

    case 'breakages':
      return event === 'INSERT'
        ? { tone: 'red', target: TARGET[table], text: t('s.casse_declaree') }
        : null;

    case 'versements':
      return event === 'INSERT'
        ? { tone: 'green', target: TARGET[table], text: t('s.versement_enregistre') }
        : null;

    case 'expenses':
      return event === 'INSERT'
        ? { tone: 'orange', target: TARGET[table], text: t('s.depense_enregistree') }
        : null;

    case 'cash_reports':
      return event === 'INSERT'
        ? { tone: 'blue', target: TARGET[table], text: t('s.caisse_cloturee') }
        : null;

    default:
      return null;
  }
};
