import React from 'react';
import LegalLayout from './LegalLayout';
import './legal.css';

const MentionsLegales = () => (
  <LegalLayout title="Mentions légales">
    <div className="legal-note">
      <strong>À compléter avant mise en service.</strong> Les champs entre crochets
      doivent être renseignés avec les informations réelles de l'éditeur. Leur
      absence est elle-même une irrégularité.
    </div>

    <h2>Éditeur du service</h2>
    <p>
      Le service <strong>Stock Expert</strong> est édité par&nbsp;:
    </p>
    <ul>
      <li>Dénomination : <strong>[Raison sociale]</strong></li>
      <li>Forme juridique : [SARL / SA / entreprise individuelle]</li>
      <li>Siège social : [Adresse complète]</li>
      <li>RCCM : [Numéro RCCM]</li>
      <li>Numéro de compte contribuable (NCC) : [NCC]</li>
      <li>Responsable de la publication : [Nom et prénom]</li>
      <li>Contact : [adresse e-mail] — [téléphone]</li>
    </ul>

    <h2>Hébergement</h2>
    <p>
      Les données et l'application sont hébergées par <strong>Supabase Inc.</strong>,
      970 Toa Payoh North, Singapour, dont l'infrastructure s'appuie sur Amazon Web
      Services. La région d'hébergement retenue est [région du projet Supabase].
    </p>

    <h2>Propriété intellectuelle</h2>
    <p>
      Le code, l'interface et les éléments graphiques de Stock Expert restent la
      propriété de l'éditeur. Les données saisies par une entreprise cliente —
      catalogue, ventes, clients, comptes utilisateurs — demeurent
      <strong> la propriété de cette entreprise</strong>. L'éditeur n'en acquiert
      aucun droit d'exploitation.
    </p>

    <h2>Signalement</h2>
    <p>
      Toute anomalie, contenu litigieux ou faille de sécurité peut être signalé à
      [adresse e-mail de contact]. Les signalements de sécurité sont traités en
      priorité.
    </p>
  </LegalLayout>
);

export default MentionsLegales;
