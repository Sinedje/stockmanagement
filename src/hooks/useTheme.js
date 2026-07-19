/**
 * useTheme.js
 * Hook to manage UI theme (light / dark).
 * Delegates to StoreContext.
 */
import { useStore } from '../context/StoreContext';

const useTheme = () => {
  const { theme, toggleTheme } = useStore();

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
  };
};

export default useTheme;
