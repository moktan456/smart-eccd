import api from './api';

export const calendarService = {
  getEvents: (year, month) =>
    api.get('/calendar', { params: { year, month } }),

  getEvent: (id) =>
    api.get(`/calendar/${id}`),

  createEvent: (data) =>
    api.post('/calendar', data),

  updateEvent: (id, data) =>
    api.put(`/calendar/${id}`, data),

  deleteEvent: (id) =>
    api.delete(`/calendar/${id}`),
};
