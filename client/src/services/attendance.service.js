import api from './api';

export const attendanceService = {
  mark: (records) => api.post('/attendance', records),
  getChildAttendance: (childId, params) => api.get(`/attendance/child/${childId}`, { params }),
  getAttendanceSummary: (childId, params) => api.get(`/attendance/child/${childId}/summary`, { params }),
  getClassAttendance: (classId, params) => api.get(`/attendance/class/${classId}`, { params }),
};
