import api from './api';

export const performanceService = {
  getChildPerformance: (childId, params) => api.get(`/performance/child/${childId}`, { params }),
  getChildBloomProfile: (childId, params) => api.get(`/performance/child/${childId}/bloom`, { params }),
  getChildTrend: (childId, params) => api.get(`/performance/child/${childId}/trend`, { params }),
  getChildFlags: (childId) => api.get(`/performance/child/${childId}/flags`),
  getClassPerformance: (classId) => api.get(`/performance/class/${classId}`),
  getCenterBloomCoverage: (params) => api.get('/performance/center/bloom-coverage', { params }),
};
