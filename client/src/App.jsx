// SMART ECCD – Root App with Role-Based Routing

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuthStore from './store/authStore';
import { FullPageSpinner } from './components/common/LoadingSpinner';
import MainLayout from './components/layout/MainLayout';

// ── Lazy-loaded pages ──────────────────────────────────────────
const Login          = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

// Super Admin
const SaDashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const SaCenters   = lazy(() => import('./pages/superadmin/Centers'));
const SaUsers     = lazy(() => import('./pages/superadmin/Users'));

// Manager
const MgrDashboard    = lazy(() => import('./pages/manager/Dashboard'));
const MgrClasses      = lazy(() => import('./pages/manager/Classes'));
const MgrChildren     = lazy(() => import('./pages/manager/Children'));
const MgrActivities   = lazy(() => import('./pages/manager/Activities'));
const MgrActivityNew  = lazy(() => import('./pages/manager/ActivityNew'));
const MgrActivityAssign = lazy(() => import('./pages/manager/ActivityAssign'));
const MgrReports      = lazy(() => import('./pages/manager/Reports'));

// Teacher
const TeacherDashboard  = lazy(() => import('./pages/teacher/Dashboard'));
const TeacherActivities = lazy(() => import('./pages/teacher/Activities'));
const TeacherConduct    = lazy(() => import('./pages/teacher/ConductActivity'));
const TeacherChildren   = lazy(() => import('./pages/teacher/Children'));
const TeacherAttendance = lazy(() => import('./pages/teacher/Attendance'));

// Parent
const ParentDashboard   = lazy(() => import('./pages/parent/Dashboard'));
const ParentPerformance = lazy(() => import('./pages/parent/ChildPerformance'));
const ParentAttendance  = lazy(() => import('./pages/parent/ChildAttendance'));
const ParentMessages    = lazy(() => import('./pages/parent/Messages'));

// Shared
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile       = lazy(() => import('./pages/Profile'));

// ── Guards ─────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, accessToken } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  if (!user) return <FullPageSpinner />;
  if (roles && !roles.includes(user.role)) return <Navigate to={getDefaultRoute(user.role)} replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { accessToken, user } = useAuthStore();
  if (accessToken && user) return <Navigate to={getDefaultRoute(user.role)} replace />;
  return children;
};

const getDefaultRoute = (role) => ({
  SUPER_ADMIN:    '/sa/dashboard',
  CENTER_MANAGER: '/manager/dashboard',
  TEACHER:        '/teacher/dashboard',
  PARENT:         '/parent/dashboard',
}[role] || '/login');

// ── App ────────────────────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

          {/* Protected – Shared Layout */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>

            {/* Super Admin */}
            <Route path="/sa/dashboard" element={<ProtectedRoute roles={['SUPER_ADMIN']}><SaDashboard /></ProtectedRoute>} />
            <Route path="/sa/centers"   element={<ProtectedRoute roles={['SUPER_ADMIN']}><SaCenters /></ProtectedRoute>} />
            <Route path="/sa/users"     element={<ProtectedRoute roles={['SUPER_ADMIN']}><SaUsers /></ProtectedRoute>} />

            {/* Center Manager */}
            <Route path="/manager/dashboard"              element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrDashboard /></ProtectedRoute>} />
            <Route path="/manager/classes"                element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrClasses /></ProtectedRoute>} />
            <Route path="/manager/children"               element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrChildren /></ProtectedRoute>} />
            <Route path="/manager/activities"             element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrActivities /></ProtectedRoute>} />
            <Route path="/manager/activities/new"         element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrActivityNew /></ProtectedRoute>} />
            <Route path="/manager/activities/:id/assign"  element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrActivityAssign /></ProtectedRoute>} />
            <Route path="/manager/reports"                element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrReports /></ProtectedRoute>} />

            {/* Teacher */}
            <Route path="/teacher/dashboard"              element={<ProtectedRoute roles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/activities"             element={<ProtectedRoute roles={['TEACHER']}><TeacherActivities /></ProtectedRoute>} />
            <Route path="/teacher/activities/:id/conduct" element={<ProtectedRoute roles={['TEACHER']}><TeacherConduct /></ProtectedRoute>} />
            <Route path="/teacher/children"               element={<ProtectedRoute roles={['TEACHER']}><TeacherChildren /></ProtectedRoute>} />
            <Route path="/teacher/attendance"             element={<ProtectedRoute roles={['TEACHER']}><TeacherAttendance /></ProtectedRoute>} />

            {/* Parent */}
            <Route path="/parent/dashboard"                          element={<ProtectedRoute roles={['PARENT']}><ParentDashboard /></ProtectedRoute>} />
            <Route path="/parent/child/:id/performance"              element={<ProtectedRoute roles={['PARENT']}><ParentPerformance /></ProtectedRoute>} />
            <Route path="/parent/child/:id/attendance"               element={<ProtectedRoute roles={['PARENT']}><ParentAttendance /></ProtectedRoute>} />
            <Route path="/parent/messages"                           element={<ProtectedRoute roles={['PARENT']}><ParentMessages /></ProtectedRoute>} />

            {/* Shared */}
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
