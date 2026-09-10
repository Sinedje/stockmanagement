import React from 'react';
import LegalLayout from './LegalLayout';
import './legal.css';

const Confidentialite = () => (
  <LegalLayout title="Politique de confidentialité">
    <div className="legal-note">
      <strong>À faire relire par un juriste.</strong> En Côte d'Ivoire, le
      traitement de données à caractère personnel relève de la loi n°2013-450 et
      doit faire l'objet d'une déclaration auprès de l'ARTCI. Ce document en
      décrit fidèlement le fonctionnement technique, mais ne remplace pas cette
      formalité.
    </div>

    <h2>Deux niveaux de responsabilité</h2>
    <p>
      Stock Expert traite deux catégories de données, dont la responsabilité
      n'incombe pas aux mêmes personnes&nbsp;:
    </p>
    <ul>
      <li>
        <strong>Les comptes utilisateurs</strong> (nom, adresse e-mail, rôle,
        magasin de rattachement, date de dernière connexion). L'éditeur en est
        responsable de traitement.
      </li>
      <li>
        <strong>Les données saisies par l'entreprise cliente</strong> — dont les
        noms et téléphones de ses propres clients. L'entreprise en reste
        responsable&nbsp;; l'éditeur n'agit que comme <strong>sous-traitant</strong>,
        pour son compte et selon ses instructions.
      </li>
    </ul>

    <h2>Données collectées</h2>
    <h3>Pour faire fonctionner le service</h3>
    <ul>
      <li>Nom, adresse e-mail et identifiant de connexion</li>
      <li>Rôle et magasin de rattachement</li>
      <li>Date et heure de dernière connexion</li>
      <li>Traces des actions sensibles (journal d'audit)</li>
    </ul>
    <h3>Saisies par l'entreprise</h3>
    <ul>
      <li>Catalogue, stocks, mouvements et inventaires</li>
      <li>Ventes, factures, encaissements et bilans de caisse</li>
      <li>Clients de l'entreprise : nom, téléphone, solde de compte</li>
    </ul>
    <p>
      Le service ne dépose <strong>aucun cookie publicitaire</strong> et
      n'utilise aucun traceur d'audience tiers. Seul le stockage local du
      navigateur est utilisé, pour maintenir la session ouverte et retenir des
      préférences d'affichage.
    </p>

    <h2>Cloisonnement entre entreprises</h2>
    <p>
      Chaque enregistrement porte l'identifiant de l'entreprise à laquelle il
      appartient, et l'isolation est appliquée par la base de données elle-même
      (<em>Row Level Security</em>), non par le code de l'application. Une requête
      qui omettrait le filtre ne renvoie donc rien&nbsp;: une entreprise ne peut
      pas accéder aux données d'une autre, y compris en cas d'erreur de
      programmation.
    </p>

    <h2>Accès de l'éditeur</h2>
    <p>
      L'administrateur de la plateforme peut consulter la liste des entreprises,
      leurs utilisateurs et leur activité, afin d'assurer le support. Chacune de
      ces interventions est inscrite dans un journal <strong>en ajout seul</strong>,
      consultable par l'entreprise concernée.
    </p>

    <h2>Conservation</h2>
    <ul>
      <li>Données d'une entreprise : conservées tant que le compte est actif, puis [durée] après sa résiliation</li>
      <li>Journal d'audit : [durée], pour permettre l'examen d'un incident</li>
      <li>Sauvegardes : [durée de rétention du plan d'hébergement]</li>
    </ul>

    <h2>Vos droits</h2>
    <p>
      Toute personne dispose d'un droit d'accès, de rectification, d'opposition
      et de suppression sur ses données. Un utilisateur s'adresse d'abord à
      l'administrateur de son entreprise. L'entreprise elle-même peut demander
      l'export complet de ses données ou leur suppression en écrivant à
      [adresse e-mail de contact].
    </p>

    <h2>Sécurité</h2>
    <ul>
      <li>Chiffrement des échanges (HTTPS) et des données au repos</li>
      <li>Mots de passe stockés sous forme d'empreintes, jamais en clair</li>
      <li>Isolation appliquée au niveau de la base de données</li>
      <li>Journal d'audit non modifiable</li>
    </ul>
    <p>
      Aucun dispositif n'est infaillible. En cas de violation de données
      susceptible d'engendrer un risque, les entreprises concernées seront
      informées sans délai injustifié.
    </p>
  </LegalLayout>
);

export default Confidentialite;
