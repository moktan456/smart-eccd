// SMART ECCD – Auth Context + Socket.io Initialization

import { createContext, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user, accessToken, fetchUser } = useAuthStore();
  const { addNotification, fetch: fetchNotifications } = useNotificationStore();

  // Load user on mount if token exists
  useEffect(() => {
    if (accessToken && !user) {
      fetchUser();
    }
  }, [accessToken]); // eslint-disable-line

  // Initialize Socket.io when user is logged in
  useEffect(() => {
    if (!user || !accessToken) return;

    fetchNotifications();

    const socket = io('/', {
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
