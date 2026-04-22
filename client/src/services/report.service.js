import api from './api';

export const reportService = {
  getChildReport: (childId) => api.get(`/reports/child/${childId}`),
  getCenterReport: (params) => api.get('/reports/center', { params }),
};
