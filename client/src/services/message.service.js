import api from './api';

export const messageService = {
  getMessages: (params) => api.get('/messages', { params }),
  send: (data) => api.post('/messages', data),
  markRead: (id) => api.patch(`/messages/${id}/read`),
  getAnnouncements: (params) => api.get('/messages/announcements', { params }),
  createAnnouncement: (data) => api.post('/messages/announcements', data),
};
