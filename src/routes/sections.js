import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * L'URL décrit la page consultée, pas le rôle de l'utilisateur.
 *
 * Le rôle est déjà visible dans la barre latérale et détermine, côté routeur,
 * quel tableau de bord est monté : le répéter dans l'adresse n'apportait rien
 * et rendait les liens impossibles à partager entre collègues de rôles
 * différents. On expose donc /articles, /inventaire… plutôt que /ceo.
 *
 * Les identifiants d'onglet internes gardent leur forme (`stock_entry`) ; seule
 * leur écriture dans l'URL est normalisée en tirets.
 */
const idToSlug = (id) => String(id).replace(/_/g, '-');
const slugToId = (slug) => String(slug || '').replace(/-/g, '_');

/**
 * Relie l'onglet actif à l'URL.
 *
 * `sections` : identifiants autorisés pour ce rôle. Une adresse inconnue
 * retombe sur `fallback` au lieu d'afficher un écran vide.
 */
export const useSectionRoute = (sections, fallback) => {
  const { section } = useParams();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const id = slugToId(section);
    return sections.includes(id) ? id : fallback;
  }, [section, sections, fallback]);

  const setActiveTab = useCallback(
    (id) => navigate(`/${idToSlug(id)}`),
    [navigate]
  );

  // Adresse inconnue : on affiche l'accueil ET on corrige la barre d'adresse,
  // sinon l'URL et le contenu affiché se contredisent. `replace` pour ne pas
  // piéger le bouton « retour » sur une adresse invalide.
  const isKnown = sections.includes(slugToId(section));
  useEffect(() => {
    if (!isKnown) navigate(`/${idToSlug(fallback)}`, { replace: true });
  }, [isKnown, fallback, navigate]);

  return [activeTab, setActiveTab];
};

/** Section d'accueil de chaque rôle, utilisée pour la redirection depuis « / ». */
export const DEFAULT_SECTION = {
  superadmin: 'companies',
  ceo: 'strategic',
  manager: 'dashboard',
  accountant: 'summary',
  storekeeper: 'deliveries',
  cashier: 'invoice',
};
