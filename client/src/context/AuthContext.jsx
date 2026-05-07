// SMART ECCD – Auth Context + Socket.io Initialization + Theme Application

import { createContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { centerService } from '../services/center.service';
import { applyTheme, restoreTheme } from '../utils/themes';
import { saveCenterCurrency } from '../utils/currency';

// In production, socket connects to the Render backend. In dev, use Vite proxy (same origin '/').
const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user, accessToken, fetchUser } = useAuthStore();
  const { addNotification, fetch: fetchNotifications } = useNotificationStore();

  // Restore saved theme immediately on mount (prevents flash of default colors)
  useEffect(() => { restoreTheme(); }, []); // eslint-disable-line

  // Load user on mount if token exists
  useEffect(() => {
    if (accessToken && !user) {
      fetchUser();
    }
  }, [accessToken]); // eslint-disable-line

  // Apply center theme when user is loaded
  useEffect(() => {
    if (!user) return;
    if (!user.centerId) return; // SUPER_ADMIN has no centerId — keep default theme
    centerService.getById(user.centerId)
      .then(({ data }) => {
        const center = data.data;
        if (center?.theme || center?.themeColor) {
          applyTheme(center.theme, center.themeColor);
        }
        if (center?.currency) {
          saveCenterCurrency(center.currency);
        }
      })
      .catch(() => {}); // silently ignore — default theme stays
  }, [user?.centerId]); // eslint-disable-line

  // Initialize Socket.io when user is logged in
  useEffect(() => {
    if (!user || !accessToken) return;

    fetchNotifications();

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken, centerId: user.centerId },
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('notification', (n) => addNotification(n));
    socket.on('new_message', () => fetchNotifications());
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

    return () => socket.disconnect();
  }, [user?.id]); // eslint-disable-line

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useAuthStore();
