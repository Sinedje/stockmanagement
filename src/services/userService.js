/**
 * userService.js
 * User management API calls.
 */
import api from './api';

const simulateDelay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const fetchUsers = async () => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get('/users');
    return response.data;
  }
  await simulateDelay();
  return null;
};

export const createUser = async (userData) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.post('/users', userData);
    return response.data;
  }
  await simulateDelay();
  return { ...userData, id: Date.now(), isActive: true };
};

export const updateUser = async (id, updates) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.put(`/users/${id}`, updates);
    return response.data;
  }
  await simulateDelay();
  return { id, ...updates };
};

export const toggleUserStatus = async (id) => {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
  }
  await simulateDelay();
  return { id };
};
