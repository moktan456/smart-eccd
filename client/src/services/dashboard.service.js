import api from './api';

export const dashboardService = {
  getCenterStats: (params) => api.get('/dashboard/center-stats', { params }),
  getTeacherToday: () => api.get('/dashboard/teacher-today'),
  getParentDashboard: (childId) => api.get(`/dashboard/parent/${childId}`),
  getSuperAdminStats: () => api.get('/dashboard/super-admin'),
};
