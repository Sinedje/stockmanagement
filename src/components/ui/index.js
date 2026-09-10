/**
 * Bibliothèque de composants d'interface réutilisables.
 *
 * Les écrans importent depuis ici — `import { Table, Toolbar, Panel } from '../ui'` —
 * plutôt que de redéfinir localement des tableaux, cartes ou champs de saisie.
 */
export { default as Panel } from './Panel';
export { default as Toolbar } from './Toolbar';
export { default as Page } from './Page';
export { default as Table, DEFAULT_PAGE_SIZE } from './Table';
export { default as SearchInput } from './SearchInput';
export { default as Select } from './Select';
export { default as Button } from './Button';

// Primitives déjà en place, réexportées pour un point d'entrée unique.
export { default as Card } from '../common/Card';
export { default as Input } from '../common/Input';
export { default as DateField } from '../common/DateField';
export { default as Modal, SelectModal } from '../common/Modal';
export { default as Pagination } from '../common/Pagination';
export { default as StatsCard } from '../common/StatsCard';
export { default as EmptyState } from '../common/EmptyState';
export { default as Widget, WidgetRow, makeNavigator } from '../common/Widget';
