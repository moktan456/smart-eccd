import api from './api';

export const activityService = {
  list: (params) => api.get('/activities', { params }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  update: (id, data) => api.put(`/activities/${id}`, data),
  archive: (id) => api.delete(`/activities/${id}`),
  assign: (id, data) => api.post(`/activities/${id}/assign`, data),
  getMyAssignments: (params) => api.get('/activities/assignments/my', { params }),
  conduct: (assignmentId, data) => api.post(`/activities/assignments/${assignmentId}/conduct`, data),
};
