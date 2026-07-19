/**
 * useSettings.js
 * Manages company settings.
 * Calls settingsService for API operations; local state managed by StoreContext.
 */
import { useState, useCallback } from 'react';
import { updateCompanySettings as apiUpdateCompanySettings } from '../services/settingsService';
import { useStore } from '../context/StoreContext';

const useSettings = () => {
  const {
    companySettings,
    updateCompanySettings: storeUpdateCompanySettings,
  } = useStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateCompanySettings = useCallback(async (newSettings) => {
    setLoading(true);
    setError(null);
    try {
      if (import.meta.env.VITE_API_URL) await apiUpdateCompanySettings(newSettings);
      storeUpdateCompanySettings(newSettings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeUpdateCompanySettings]);

  return {
    companySettings,
    loading,
    error,
    updateCompanySettings,
  };
};

export default useSettings;
