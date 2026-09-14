/**
 * breakageService.js
 * API calls for Casses (breakages) and Reconditionnements (repackagings).
 */
import api from './api';
import { hasSupabaseSession, fetchBreakages as sbBreakages, fetchRepackagings as sbRepackagings , createBreakage as sbCreateBreakage, createRepackaging as sbCreateRepackaging } from './supabaseData';

const simulateDelay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const fetchBreakages = async () => {
  if (await hasSupabaseSession()) return sbBreakages();
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/breakages');
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const createBreakage = async (breakageData) => {
  if (await hasSupabaseSession()) return sbCreateBreakage(breakageData);
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/breakages', breakageData);
    return response.data;
  }
  await simulateDelay();
  return { ...breakageData, id: Date.now() };
};

export const fetchRepackagings = async () => {
  if (await hasSupabaseSession()) return sbRepackagings();
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/repackagings');
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const createRepackaging = async (repackagingData) => {
  if (await hasSupabaseSession()) return sbCreateRepackaging(repackagingData);
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/repackagings', repackagingData);
    return response.data;
  }
  await simulateDelay();
  return { ...repackagingData, id: Date.now() };
};
