/**
 * settingsService.js
 * Company settings API calls.
 */
import api from './api';
import { hasSupabaseSession, fetchCompanySettings as sbCompanySettings } from './supabaseData';

const simulateDelay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const fetchCompanySettings = async () => {
  if (await hasSupabaseSession()) return sbCompanySettings();
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/settings/company');
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const updateCompanySettings = async (settings) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.put('/settings/company', settings);
    return response.data;
  }
  await simulateDelay();
  return settings;
};
