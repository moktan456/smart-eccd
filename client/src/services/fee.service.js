import api from './api';

export const feeService = {
  // Fee Structures
  getStructures: () =>
    api.get('/fees/structures'),

  createStructure: (data) =>
    api.post('/fees/structures', data),

  updateStructure: (id, data) =>
    api.put(`/fees/structures/${id}`, data),

  deleteStructure: (id) =>
    api.delete(`/fees/structures/${id}`),

  // Fee Records
  getRecords: (params = {}) =>
    api.get('/fees/records', { params }),

  getSummary: () =>
    api.get('/fees/summary'),

  recordPayment: (recordId, data) =>
    api.post(`/fees/records/${recordId}/pay`, data),

  bulkCreate: (data) =>
    api.post('/fees/records/bulk', data),

  sendOverdueReminders: () =>
    api.post('/fees/reminders'),
};
