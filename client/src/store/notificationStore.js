// SMART ECCD – Notification Zustand Store

import { create } from 'zustand';
import api from '../services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/notifications?limit=10');
      set({ notifications: data.data, unreadCount: data.unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await api.patch('/notifications/read-all');
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  // Called by Socket.io when a new notification arrives
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 20),
      unreadCount: state.unreadCount + 1,
    }));
  },
}));

export default useNotificationStore;
