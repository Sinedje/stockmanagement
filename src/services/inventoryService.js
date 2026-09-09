import api from './api';

export const inventoryService = {
  logBulkAdjustments: async (adjustments) => {
    const { data } = await api.post('/inventory/adjustments/bulk', { adjustments });
    return data;
  },
  
  getGlobalHistory: async () => {
    const { data } = await api.get('/inventory/history');
    return data;
  }
};
