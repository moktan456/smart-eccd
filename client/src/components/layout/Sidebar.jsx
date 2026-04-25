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
  dashboard:    'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6',
  users:        'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  building:     'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  activity:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  chart:        'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  calendar:     'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  message:      'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  report:       'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  child:        'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  notification: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  // New icons
  classroom:    'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  fee:          'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  leave:        'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  settings:     'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  performance:  'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  attendance:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  staff:        'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  bell:         'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  print:        'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
};

const NAV_ITEMS = {
  SUPER_ADMIN: [
    { to: '/sa/dashboard',  label: 'Dashboard',  icon: ICONS.dashboard },
    { to: '/sa/centers',    label: 'Centers',     icon: ICONS.building },
    { to: '/sa/users',      label: 'Users',       icon: ICONS.users },
    { to: '/sa/settings',   label: 'Settings',    icon: ICONS.settings },
  ],
  CENTER_MANAGER: [
    { to: '/manager/dashboard',      label: 'Dashboard',      icon: ICONS.dashboard },
    { to: '/manager/staff',          label: 'Staff',          icon: ICONS.staff },
    { to: '/manager/classes',        label: 'Classes',        icon: ICONS.building },
    { to: '/manager/classrooms',     label: 'Classrooms',     icon: ICONS.classroom },
    { to: '/manager/children',       label: 'Children',       icon: ICONS.child },
    { to: '/manager/activities',     label: 'Activities',     icon: ICONS.activity },
    { to: '/manager/calendar',       label: 'Calendar',       icon: ICONS.calendar },
    { to: '/manager/fees',           label: 'Fees',           icon: ICONS.fee },
    { to: '/manager/leave',          label: 'Leave',          icon: ICONS.leave },
    { to: '/manager/notifications',  label: 'Notifications',  icon: ICONS.bell },
    { to: '/manager/reports',        label: 'Reports',        icon: ICONS.report },
  ],
  TEACHER: [
    { to: '/teacher/dashboard',   label: 'Dashboard',   icon: ICONS.dashboard },
    { to: '/teacher/activities',  label: 'Activities',  icon: ICONS.activity },
    { to: '/teacher/children',    label: 'My Children', icon: ICONS.child },
    { to: '/teacher/attendance',  label: 'Attendance',  icon: ICONS.calendar },
  ],
  PARENT: [
    { to: '/parent/dashboard',   label: 'Dashboard',   icon: ICONS.dashboard },
    { to: '/parent/reports',     label: 'Reports',     icon: ICONS.print },
    { to: '/parent/leave',       label: 'Leave',       icon: ICONS.leave },
    { to: '/parent/messages',    label: 'Messages',    icon: ICONS.message },
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
        <div>
          <span className="font-bold text-gray-900 text-sm">SMART ECCD</span>
          <span className="ml-1 text-xs font-semibold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full">v2.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
              <p className="text-xs text-gray-500 capitalize">{user.role?.replace(/_/g, ' ').toLowerCase()}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
