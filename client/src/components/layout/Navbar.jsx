// SMART ECCD – Top Navigation Bar

import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      {/* Page title placeholder — each page can set a document.title */}
      <div />

      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[1.1rem] h-[1.1rem] flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
