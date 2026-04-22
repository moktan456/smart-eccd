// SMART ECCD – Role-Based Sidebar Navigation

import { NavLink } from 'react-router-dom';
import { classNames } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';

// Icons (inline SVG for zero-dependency)
const Icon = ({ path, className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
  </svg>
);

const ICONS = {
  dashboard:   'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6',
  users:       'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  building:    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  activity:    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  chart:       'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  calendar:    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  message:     'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  report:      'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  child:       'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  notification:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
};

const NAV_ITEMS = {
  SUPER_ADMIN: [
    { to: '/sa/dashboard',  label: 'Dashboard',  icon: ICONS.dashboard },
    { to: '/sa/centers',    label: 'Centers',     icon: ICONS.building },
    { to: '/sa/users',      label: 'Users',       icon: ICONS.users },
  ],
  CENTER_MANAGER: [
    { to: '/manager/dashboard',  label: 'Dashboard',   icon: ICONS.dashboard },
    { to: '/manager/classes',    label: 'Classes',      icon: ICONS.building },
    { to: '/manager/children',   label: 'Children',     icon: ICONS.child },
    { to: '/manager/activities', label: 'Activities',   icon: ICONS.activity },
    { to: '/manager/reports',    label: 'Reports',      icon: ICONS.report },
  ],
  TEACHER: [
    { to: '/teacher/dashboard',   label: 'Dashboard',     icon: ICONS.dashboard },
    { to: '/teacher/activities',  label: 'Activities',    icon: ICONS.activity },
    { to: '/teacher/children',    label: 'My Children',   icon: ICONS.child },
    { to: '/teacher/attendance',  label: 'Attendance',    icon: ICONS.calendar },
  ],
  PARENT: [
    { to: '/parent/dashboard',   label: 'Dashboard',     icon: ICONS.dashboard },
    { to: '/parent/messages',    label: 'Messages',      icon: ICONS.message },
  ],
};

const COMMON_ITEMS = [
  { to: '/notifications', label: 'Notifications', icon: ICONS.notification },
  { to: '/profile',       label: 'Profile',        icon: ICONS.users },
];

const Sidebar = () => {
  const { user } = useAuthStore();
  const navItems = NAV_ITEMS[user?.role] || [];

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">SE</span>
        </div>
        <span className="font-bold text-gray-900 text-sm">SMART ECCD</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              classNames('nav-link', isActive && 'active')
            }
          >
            <Icon path={item.icon} />
            {item.label}
          </NavLink>
        ))}
        <div className="my-3 border-t border-gray-100" />
        {COMMON_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => classNames('nav-link', isActive && 'active')}
          >
            <Icon path={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      {user && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
