import api from './api';

export const centerService = {
  list: (params) => api.get('/centers', { params }),
  getById: (id) => api.get(`/centers/${id}`),
  create: (data) => api.post('/centers', data),
  update: (id, data) => api.put(`/centers/${id}`, data),
  delete: (id) => api.delete(`/centers/${id}`),
};
