import React from 'react';
import Toolbar from './Toolbar';

/**
 * Ossature commune à tous les écrans.
 *
 * Un écran = une `Toolbar` (recherche, filtres, actions) puis un corps de page.
 * Utiliser ce composant partout garantit les mêmes espacements, la même largeur
 * et la même séparation commandes / données, quelle que soit la page.
 *
 *   <Page toolbar={<>…filtres…</>} actions={<Button …/>}>
 *     <Panel noPadding><Table … /></Panel>
 *   </Page>
 */
const Page = ({ toolbar, actions, children, className = '' }) => (
  <div className={`animate-fade-in space-y-4 ${className}`}>
    {(toolbar || actions) && <Toolbar right={actions}>{toolbar}</Toolbar>}
    {children}
  </div>
);

export default Page;
