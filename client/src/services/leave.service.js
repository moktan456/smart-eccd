import api from './api';

export const leaveService = {
  // Parent: create and list own requests
  getMyRequests: (params = {}) =>
    api.get('/leave', { params }),

  createRequest: (data) =>
    api.post('/leave', data),

  // Teacher / Manager: list all requests for review
  getPendingRequests: (params = {}) =>
    api.get('/leave/pending', { params }),

  reviewRequest: (id, data) =>
    api.put(`/leave/${id}/review`, data),
};
