// SMART ECCD – Auth Zustand Store

import { create } from 'zustand';
import { authService } from '../services/auth.service';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isLoading: false,
  error: null,

  // Login
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authService.login(credentials);
      const { accessToken, user } = data.data;
      localStorage.setItem('accessToken', accessToken);
      set({ user, accessToken, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed.';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  // Logout
  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors — clear local state regardless
    }
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null });
  },

  // Fetch current user
  fetchUser: async () => {
    if (!get().accessToken) return;
    set({ isLoading: true });
    try {
      const { data } = await authService.getMe();
      set({ user: data.data, isLoading: false });
    } catch {
      localStorage.removeItem('accessToken');
      set({ user: null, accessToken: null, isLoading: false });
    }
  },

  // Helper: check if user has a specific role
  hasRole: (...roles) => {
    const user = get().user;
    return user ? roles.includes(user.role) : false;
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
