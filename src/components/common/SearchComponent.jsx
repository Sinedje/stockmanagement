import React from 'react';
import SearchInput from '../ui/SearchInput';

/**
 * Ancien nom du champ de recherche, conservé pour les écrans qui l'utilisent
 * déjà. Il délègue au composant partagé afin que toutes les recherches de
 * l'application aient exactement la même apparence.
 */
const SearchComponent = ({ width = 260, ...props }) => (
  <SearchInput width={width} emitEvent {...props} />
);

export default SearchComponent;
