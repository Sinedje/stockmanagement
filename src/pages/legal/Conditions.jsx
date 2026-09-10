import React from 'react';
import LegalLayout from './LegalLayout';
import './legal.css';

const Conditions = () => (
  <LegalLayout title="Conditions générales d'utilisation">
    <div className="legal-note">
      <strong>À faire relire par un juriste</strong> avant tout engagement
      commercial, en particulier les articles portant sur la responsabilité, la
      disponibilité et la résiliation.
    </div>

    <h2>1. Objet</h2>
    <p>
      Les présentes conditions régissent l'accès et l'utilisation de
      <strong> Stock Expert</strong>, service de gestion de stock, de facturation
      et de caisse destiné aux commerces et distributeurs. Leur acceptation par
      l'administrateur d'une entreprise engage l'ensemble des utilisateurs de
      celle-ci.
    </p>

    <h2>2. Comptes et accès</h2>
    <p>
      Chaque entreprise dispose d'un espace cloisonné. Son administrateur crée
      les comptes de ses collaborateurs et leur attribue un rôle. Il lui revient
      de retirer sans délai l'accès d'une personne quittant l'entreprise.
    </p>
    <p>
      Les identifiants sont personnels. Toute action réalisée depuis un compte
      est réputée effectuée par son titulaire&nbsp;; un identifiant partagé rend
      cette imputation impossible et engage l'entreprise.
    </p>

    <h2>3. Propriété des données</h2>
    <p>
      Les données saisies restent la propriété de l'entreprise. L'éditeur ne les
      exploite ni ne les cède à des tiers, et n'y accède que pour assurer le
      support ou répondre à une obligation légale. Chaque accès est inscrit au
      journal d'audit, consultable par l'entreprise.
    </p>
    <p>
      L'entreprise peut à tout moment demander l'export complet de ses données
      dans un format exploitable.
    </p>

    <h2>4. Disponibilité</h2>
    <p>
      Le service est fourni sans garantie de disponibilité ininterrompue. Des
      interruptions peuvent survenir pour maintenance, mise à jour ou du fait de
      l'hébergeur. Les interruptions programmées sont annoncées lorsque cela est
      possible.
    </p>
    <div className="legal-note">
      Aucun engagement chiffré de disponibilité n'est pris à ce jour. Si un
      niveau de service doit être garanti, il fera l'objet d'un contrat distinct.
    </div>

    <h2>5. Sauvegardes</h2>
    <p>
      Des sauvegardes sont réalisées selon la périodicité du plan d'hébergement
      retenu. Elles visent à faire face à un incident technique et ne
      constituent pas un service d'archivage&nbsp;: il appartient à l'entreprise
      d'exporter régulièrement ses données si elle souhaite en conserver une
      copie indépendante.
    </p>

    <h2>6. Usage attendu</h2>
    <p>Il est interdit de&nbsp;:</p>
    <ul>
      <li>tenter d'accéder aux données d'une autre entreprise&nbsp;;</li>
      <li>contourner les limitations techniques ou les contrôles d'accès&nbsp;;</li>
      <li>utiliser le service à des fins illicites&nbsp;;</li>
      <li>revendre l'accès au service sans accord écrit de l'éditeur.</li>
    </ul>

    <h2>7. Suspension</h2>
    <p>
      L'éditeur peut suspendre l'accès d'une entreprise en cas de manquement aux
      présentes conditions ou de défaut de paiement. La suspension bloque la
      connexion mais <strong>ne supprime aucune donnée</strong>&nbsp;: celles-ci
      restent récupérables pendant la durée de conservation prévue.
    </p>

    <h2>8. Résiliation</h2>
    <p>
      L'entreprise peut résilier à tout moment. Elle dispose alors de [durée]
      pour exporter ses données, à l'issue de laquelle celles-ci sont supprimées
      définitivement, y compris des sauvegardes selon leur cycle de rotation.
    </p>

    <h2>9. Responsabilité</h2>
    <p>
      Le service est un outil de gestion&nbsp;; il ne se substitue pas aux
      obligations comptables et fiscales de l'entreprise, qui demeure seule
      responsable de l'exactitude de ses écritures et de ses déclarations.
    </p>
    <p>
      La responsabilité de l'éditeur ne saurait être engagée pour les
      conséquences indirectes d'une indisponibilité ou d'une perte de données,
      ni pour l'usage fait du service par l'entreprise.
    </p>

    <h2>10. Évolution des conditions</h2>
    <p>
      Les présentes conditions peuvent être modifiées. Toute modification
      substantielle est portée à la connaissance des administrateurs
      d'entreprise, qui devront l'accepter pour continuer à utiliser le service.
    </p>

    <h2>11. Droit applicable</h2>
    <p>
      Les présentes conditions sont régies par le droit [pays]. À défaut de
      résolution amiable, tout litige relève des juridictions compétentes de
      [ville].
    </p>
  </LegalLayout>
);

export default Conditions;
