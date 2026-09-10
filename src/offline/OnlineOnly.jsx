import React from 'react';
import { Tooltip } from 'antd';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * Neutralise une action qui ne peut pas s'exécuter hors connexion.
 *
 * Certaines opérations engagent plusieurs postes ou modifient des stocks
 * partagés — transferts, validation d'inventaire, clôture de caisse. Les
 * autoriser hors ligne produirait des états contradictoires que personne ne
 * saurait départager ensuite. Contrairement à une vente, elles ne peuvent pas
 * être simplement rejouées : leur résultat dépend de l'état du serveur au
 * moment où elles s'exécutent.
 *
 * Le bouton reste visible mais inactif, avec la raison en info-bulle : le
 * masquer laisserait croire à une disparition de la fonctionnalité.
 */
const OnlineOnly = ({ children, reason }) => {
  const { online } = useOnlineStatus();
  if (online) return children;

  const message = reason
    || "Indisponible hors connexion : cette opération modifie des données partagées.";

  return (
    <Tooltip title={message}>
      {/* Enveloppe nécessaire : un élément désactivé n'émet pas d'évènement
          de survol, l'info-bulle ne s'afficherait donc jamais. */}
      <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
        {React.cloneElement(children, {
          disabled: true,
          style: { ...(children.props.style || {}), pointerEvents: 'none' },
        })}
      </span>
    </Tooltip>
  );
};

export default OnlineOnly;
