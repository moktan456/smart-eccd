# RBAC Redesign & Theme Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign role permissions so SuperAdmin handles center setup/theme, Manager handles user/class management, and Teacher handles all activity management — and fix the broken theme system so saved themes actually apply to the UI.

**Architecture:** Three-layer approach: (1) backend RBAC permission map updated to match new role boundaries, (2) theme system refactored from DB-only storage to live CSS custom properties applied on login, (3) frontend routes/pages reorganised so each role only sees their domain. No database schema changes are needed — roles already exist as Prisma enums.

**Tech Stack:** React 18 + Vite, React Router v6, Tailwind CSS v3, Express.js, Prisma, JWT, Zustand

---

## File Map

| File | Change |
|------|--------|
| `server/src/middleware/rbac.middleware.js` | Remove `activity:write` from CENTER_MANAGER; add `activity:write` to TEACHER |
| `client/tailwind.config.js` | Change primary colors to CSS custom properties |
| `client/src/styles/index.css` | Add CSS variable defaults for default theme |
| `client/src/utils/themes.js` | New — theme palette definitions |
| `client/src/context/AuthContext.jsx` | Apply theme CSS vars when user/center loads |
| `client/src/pages/superadmin/CenterSettings.jsx` | Fix: fetch all centers, add selector so SA picks which center to configure |
| `client/src/pages/superadmin/Users.jsx` | Restrict SA to creating CENTER_MANAGER/SUPER_ADMIN only (not TEACHER) |
| `client/src/App.jsx` | Remove manager activity routes; add teacher activity routes |
| `client/src/components/layout/Sidebar.jsx` | Remove Activities from manager nav |
| `client/src/pages/teacher/Activities.jsx` | Restructure to show library + my assignments + create button |
| `client/src/pages/teacher/ActivityNew.jsx` | New — adapted from MgrActivityNew |
| `client/src/pages/teacher/ActivityAssign.jsx` | New — adapted from MgrActivityAssign, scoped to teacher's classes |

---

## Task 1: Update RBAC Permissions

**Files:**
- Modify: `server/src/middleware/rbac.middleware.js`

- [ ] **Step 1: Update the PERMISSIONS object**

Replace the PERMISSIONS constant in `server/src/middleware/rbac.middleware.js` with:

```javascript
const PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  CENTER_MANAGER: [
    'center:read', 'center:write',
    'class:read',  'class:write',
    'child:read',  'child:write',
    'user:read',   'user:write',
    'report:read', 'report:write',
    'attendance:read',
    'performance:read',
    'message:read', 'message:write',
    'announcement:write',
    'notification:read', 'notification:write',
    'fee:read',    'fee:write',
    'leave:read',  'leave:write',
    'calendar:read', 'calendar:write',
    // activity:read only — activity creation/assignment is Teacher's domain
    'activity:read',
  ],
  TEACHER: [
    // Full activity ownership: create, edit, assign, conduct, record
    'activity:write', 'activity:conduct', 'activity:read',
    'attendance:write', 'attendance:read:own-class',
    'performance:write', 'performance:read:own-class',
    'child:read:own-class',
    'class:read:own',
    'message:read', 'message:write',
    'notification:read',
    'leave:read', 'leave:write',
    'calendar:read',
    'report:read',
  ],
  PARENT: [
    'performance:read:own-child',
    'attendance:read:own-child',
    'child:read:own-child',
    'message:read', 'message:write',
    'notification:read',
    'leave:read', 'leave:write',
    'fee:read',
    'calendar:read',
    'report:read',
  ],
};
```

- [ ] **Step 2: Verify the file saves correctly**

Run: `node -e "const m = require('./server/src/middleware/rbac.middleware'); console.log('CENTER_MANAGER activity:write:', m.PERMISSIONS.CENTER_MANAGER.includes('activity:write')); console.log('TEACHER activity:write:', m.PERMISSIONS.TEACHER.includes('activity:write'));"`

Expected output:
```
CENTER_MANAGER activity:write: false
TEACHER activity:write: true
```

- [ ] **Step 3: Commit**

```bash
git add server/src/middleware/rbac.middleware.js
git commit -m "feat: shift activity management from CENTER_MANAGER to TEACHER in RBAC"
```

---

## Task 2: Theme Infrastructure (CSS Custom Properties)

**Files:**
- Create: `client/src/utils/themes.js`
- Modify: `client/tailwind.config.js`
- Modify: `client/src/styles/index.css`

- [ ] **Step 1: Create theme palette definitions**

Create `client/src/utils/themes.js`:

```javascript
// Theme palettes for SMART ECCD
// Each palette maps to Tailwind's primary color scale

export const THEME_PALETTES = {
  default: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    500: '#6366f1',
    600: '#4F46E5',
    700: '#4338CA',
  },
  ocean: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    500: '#38bdf8',
    600: '#0EA5E9',
    700: '#0284C7',
  },
  forest: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    500: '#4ade80',
    600: '#16A34A',
    700: '#15803D',
  },
  sunset: {
    50:  '#fff7ed',
    100: '#ffedd5',
    500: '#fb923c',
    600: '#EA580C',
    700: '#C2410C',
  },
  rose: {
    50:  '#fff1f2',
    100: '#ffe4e6',
    500: '#fb7185',
    600: '#E11D48',
    700: '#BE123C',
  },
};

/**
 * Given a theme name and optional custom hex color, return the palette to apply.
 * Falls back to default if theme name is unknown.
 */
export function resolvePalette(themeName, themeColor) {
  if (THEME_PALETTES[themeName]) return THEME_PALETTES[themeName];
  // Custom color: generate approximate palette around the custom hex
  if (themeColor) {
    return {
      50:  themeColor + '15',
      100: themeColor + '30',
      500: themeColor,
      600: themeColor,
      700: themeColor,
    };
  }
  return THEME_PALETTES.default;
}

/**
 * Apply a theme palette to the document root via CSS custom properties.
 */
export function applyTheme(themeName, themeColor) {
  const palette = resolvePalette(themeName, themeColor);
  const root = document.documentElement;
  root.style.setProperty('--color-primary-50',  palette[50]);
  root.style.setProperty('--color-primary-100', palette[100]);
  root.style.setProperty('--color-primary-500', palette[500]);
  root.style.setProperty('--color-primary-600', palette[600]);
  root.style.setProperty('--color-primary-700', palette[700]);
}
```

- [ ] **Step 2: Update Tailwind config to use CSS custom properties**

Replace `client/tailwind.config.js` with:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SMART ECCD Brand — driven by CSS custom properties set at runtime
        primary: {
          50:  'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
        },
        // Bloom's Taxonomy Colors (fixed — not themed)
        bloom: {
          remember:   '#E74C3C',
          understand: '#E67E22',
          apply:      '#F1C40F',
          analyze:    '#27AE60',
          evaluate:   '#2980B9',
          create:     '#8E44AD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Add CSS variable defaults to index.css**

At the top of the `@layer base` block in `client/src/styles/index.css`, add default CSS variable values (before the `*` rule):

```css
@layer base {
  :root {
    --color-primary-50:  #eef2ff;
    --color-primary-100: #e0e7ff;
    --color-primary-500: #6366f1;
    --color-primary-600: #4F46E5;
    --color-primary-700: #4338CA;
  }
  /* ... rest of existing base rules unchanged ... */
```

- [ ] **Step 4: Commit**

```bash
git add client/src/utils/themes.js client/tailwind.config.js client/src/styles/index.css
git commit -m "feat: add CSS custom property theme system for dynamic color switching"
```

---

## Task 3: Apply Theme on Login

**Files:**
- Modify: `client/src/context/AuthContext.jsx`

- [ ] **Step 1: Import applyTheme and centerService, fetch center on user load**

Replace the contents of `client/src/context/AuthContext.jsx` with:

```javascript
// SMART ECCD – Auth Context + Socket.io Initialization + Theme Application

import { createContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { centerService } from '../services/center.service';
import { applyTheme } from '../utils/themes';

const SOCKET_URL = import.meta.env.VITE_API_URL || '/';

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
```

- [ ] **Step 2: Also re-apply theme after SA saves center settings**

We'll handle this in Task 4 (CenterSettings page calls `applyTheme` after a successful save).

- [ ] **Step 3: Commit**

```bash
git add client/src/context/AuthContext.jsx
git commit -m "feat: apply center theme as CSS custom properties on user login"
```

---

## Task 4: Fix SA Center Settings (Theme Selector)

**Files:**
- Modify: `client/src/pages/superadmin/CenterSettings.jsx`

The current page uses `user.centerId` which SUPER_ADMIN doesn't have. Fix: fetch all centers and let SA select which center to configure.

- [ ] **Step 1: Rewrite CenterSettings.jsx**

Replace the entire contents of `client/src/pages/superadmin/CenterSettings.jsx` with:

```javascript
import { useState, useEffect } from 'react';
import { centerService } from '../../services/center.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { applyTheme } from '../../utils/themes';

const THEMES = [
  { value: 'default', label: 'Indigo',  color: '#4F46E5' },
  { value: 'ocean',   label: 'Ocean',   color: '#0EA5E9' },
  { value: 'forest',  label: 'Forest',  color: '#16A34A' },
  { value: 'sunset',  label: 'Sunset',  color: '#EA580C' },
  { value: 'rose',    label: 'Rose',    color: '#E11D48' },
];

const EMPTY_FORM = {
  name: '', address: '', phone: '', email: '', website: '',
  theme: 'default', themeColor: '#4F46E5',
  latitude: '', longitude: '',
};

const CenterSettings = () => {
  const [centers, setCenters]   = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm]         = useState(EMPTY_FORM);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  // Load all centers for SA to pick from
  useEffect(() => {
    centerService.list({ limit: 100 })
      .then(({ data }) => {
        setCenters(data.data || []);
        if (data.data?.length > 0) setSelectedId(data.data[0].id);
      })
      .finally(() => setLoadingCenters(false));
  }, []);

  // Load selected center's settings into form
  useEffect(() => {
    if (!selectedId) return;
    centerService.getById(selectedId).then(({ data }) => {
      const c = data.data;
      setForm({
        name:       c.name       || '',
        address:    c.address    || '',
        phone:      c.phone      || '',
        email:      c.email      || '',
        website:    c.website    || '',
        theme:      c.theme      || 'default',
        themeColor: c.themeColor || '#4F46E5',
        latitude:   c.latitude   != null ? String(c.latitude)  : '',
        longitude:  c.longitude  != null ? String(c.longitude) : '',
      });
    });
  }, [selectedId]);

  const pickTheme = (t) => setForm(f => ({ ...f, theme: t.value, themeColor: t.color }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form };
      if (payload.latitude)  payload.latitude  = parseFloat(payload.latitude);
      if (payload.longitude) payload.longitude = parseFloat(payload.longitude);
      if (!payload.latitude)  delete payload.latitude;
      if (!payload.longitude) delete payload.longitude;
      await centerService.update(selectedId, payload);
      applyTheme(form.theme, form.themeColor);
      setSuccess('Center settings saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const centerOptions = centers.map(c => ({ value: c.id, label: c.name }));

  if (loadingCenters) return <div className="text-center py-12 text-gray-400">Loading…</div>;
  if (centers.length === 0) return <div className="text-center py-12 text-gray-400">No centers found. Create a center first.</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Center Settings</h1>

      {/* Center Selector */}
      <Card title="Select Center">
        <Select
          label="Configure settings for"
          value={selectedId}
          onChange={e => { setSelectedId(e.target.value); setSuccess(''); setError(''); }}
          options={centerOptions}
        />
      </Card>

      {error   && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card title="Basic Information">
          <div className="space-y-4">
            <Input label="Center Name"    value={form.name}    onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
            <Input label="Address"        value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone"        value={form.phone}   onChange={e => setForm(f=>({...f,phone:e.target.value}))} />
              <Input label="Email"        type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
            </div>
            <Input label="Website (optional)" value={form.website} onChange={e => setForm(f=>({...f,website:e.target.value}))} placeholder="https://…" />
          </div>
        </Card>

        {/* Location */}
        <Card title="Location (optional)">
          <p className="text-xs text-gray-500 mb-3">Used for map display. Find coordinates at maps.google.com.</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Latitude"  value={form.latitude}  onChange={e => setForm(f=>({...f,latitude:e.target.value}))}  placeholder="e.g. 14.5995" />
            <Input label="Longitude" value={form.longitude} onChange={e => setForm(f=>({...f,longitude:e.target.value}))} placeholder="e.g. 120.9842" />
          </div>
        </Card>

        {/* Theme */}
        <Card title="Theme & Branding">
          <p className="text-xs text-gray-500 mb-4">Choose a colour theme for this center's interface.</p>
          <div className="grid grid-cols-5 gap-3">
            {THEMES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => pickTheme(t)}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${form.theme === t.value ? 'border-gray-900 shadow-md' : 'border-transparent hover:border-gray-200'}`}
              >
                <div className="w-10 h-10 rounded-full shadow-inner" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-medium text-gray-700">{t.label}</span>
                {form.theme === t.value && <span className="text-xs text-gray-500">✓ Active</span>}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Custom Colour</label>
            <input
              type="color"
              value={form.themeColor}
              onChange={e => setForm(f=>({...f,themeColor:e.target.value,theme:'custom'}))}
              className="h-9 w-16 rounded cursor-pointer border border-gray-200"
            />
            <span className="text-sm text-gray-600 font-mono">{form.themeColor}</span>
          </div>
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: form.themeColor + '15', borderLeft: `4px solid ${form.themeColor}` }}>
            <p className="text-sm font-semibold" style={{ color: form.themeColor }}>{form.name || 'Your Center Name'}</p>
            <p className="text-xs text-gray-500 mt-0.5">Theme preview · SMART ECCD</p>
          </div>
        </Card>

        <Button type="submit" loading={saving}>Save Settings</Button>
      </form>
    </div>
  );
};

export default CenterSettings;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/superadmin/CenterSettings.jsx
git commit -m "fix: SA center settings now loads centers list so theme selector works"
```

---

## Task 5: Restrict SA Users Page

**Files:**
- Modify: `client/src/pages/superadmin/Users.jsx`

SA should only create CENTER_MANAGER accounts — TEACHER creation belongs to the Manager.

- [ ] **Step 1: Update role options in Users.jsx**

In `client/src/pages/superadmin/Users.jsx`, replace lines 13–27 (the ROLE_FILTER_OPTIONS and ROLE_CREATE_OPTIONS constants) with:

```javascript
const ROLE_FILTER_OPTIONS = [
  { value: '',              label: 'All Roles' },
  { value: 'SUPER_ADMIN',  label: 'Super Admin' },
  { value: 'CENTER_MANAGER', label: 'Center Manager' },
  { value: 'PARENT',       label: 'Parent' },
];

const ROLE_CREATE_OPTIONS = [
  { value: 'CENTER_MANAGER', label: 'Center Manager' },
  { value: 'SUPER_ADMIN',   label: 'Super Admin' },
  { value: 'PARENT',        label: 'Parent' },
];
```

Also update line 35 to default the create form to CENTER_MANAGER:

```javascript
const EMPTY_FORM = { name: '', email: '', password: '', role: 'CENTER_MANAGER', centerId: '' };
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/superadmin/Users.jsx
git commit -m "feat: restrict SA user creation to CENTER_MANAGER, SUPER_ADMIN, PARENT only"
```

---

## Task 6: Remove Activity Management from Manager (Frontend)

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/layout/Sidebar.jsx`

- [ ] **Step 1: Remove manager activity lazy imports and routes from App.jsx**

In `client/src/App.jsx`, remove lines 25–27 (the manager activity lazy imports):

```javascript
// DELETE these three lines:
const MgrActivities     = lazy(() => import('./pages/manager/Activities'));
const MgrActivityNew    = lazy(() => import('./pages/manager/ActivityNew'));
const MgrActivityAssign = lazy(() => import('./pages/manager/ActivityAssign'));
```

Then remove lines 101–103 (the manager activity routes):

```javascript
// DELETE these three route lines:
<Route path="/manager/activities"             element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrActivities /></ProtectedRoute>} />
<Route path="/manager/activities/new"         element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrActivityNew /></ProtectedRoute>} />
<Route path="/manager/activities/:id/assign"  element={<ProtectedRoute roles={['CENTER_MANAGER']}><MgrActivityAssign /></ProtectedRoute>} />
```

- [ ] **Step 2: Remove Activities from manager sidebar nav**

In `client/src/components/layout/Sidebar.jsx`, update the CENTER_MANAGER nav items (lines 44–56) — remove the Activities entry:

```javascript
CENTER_MANAGER: [
  { to: '/manager/dashboard',      label: 'Dashboard',      icon: ICONS.dashboard },
  { to: '/manager/staff',          label: 'Staff',          icon: ICONS.staff },
  { to: '/manager/classes',        label: 'Classes',        icon: ICONS.building },
  { to: '/manager/classrooms',     label: 'Classrooms',     icon: ICONS.classroom },
  { to: '/manager/children',       label: 'Children',       icon: ICONS.child },
  { to: '/manager/calendar',       label: 'Calendar',       icon: ICONS.calendar },
  { to: '/manager/fees',           label: 'Fees',           icon: ICONS.fee },
  { to: '/manager/leave',          label: 'Leave',          icon: ICONS.leave },
  { to: '/manager/notifications',  label: 'Notifications',  icon: ICONS.bell },
  { to: '/manager/reports',        label: 'Reports',        icon: ICONS.report },
],
```

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx client/src/components/layout/Sidebar.jsx
git commit -m "feat: remove activity management from CENTER_MANAGER, hand off to TEACHER"
```

---

## Task 7: Create Teacher ActivityNew Page

**Files:**
- Create: `client/src/pages/teacher/ActivityNew.jsx`

- [ ] **Step 1: Create the new file**

Create `client/src/pages/teacher/ActivityNew.jsx`:

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { BLOOM_LEVELS, BLOOM_COLORS, BLOOM_LABELS, ACTIVITY_TYPES } from '../../utils/constants';

const TeacherActivityNew = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', instructions: '',
    bloomLevels: [], activityType: 'Group', ageGroup: '',
    durationMins: 30, learningGoals: [''], status: 'PUBLISHED',
  });

  const toggleBloom = (level) => {
    setForm(f => ({
      ...f,
      bloomLevels: f.bloomLevels.includes(level)
        ? f.bloomLevels.filter(l => l !== level)
        : [...f.bloomLevels, level],
    }));
  };

  const handleGoalChange = (i, val) => {
    const goals = [...form.learningGoals];
    goals[i] = val;
    setForm(f => ({ ...f, learningGoals: goals }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, learningGoals: form.learningGoals.filter(Boolean) };
      await activityService.create(data);
      navigate('/teacher/activities');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create activity.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Design New Activity</h1>
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Basic Information">
          <div className="space-y-4">
            <Input label="Title" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea className="form-input min-h-[80px]" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea className="form-input min-h-[100px]" value={form.instructions} onChange={e => setForm(f=>({...f,instructions:e.target.value}))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Activity Type" value={form.activityType} onChange={e => setForm(f=>({...f,activityType:e.target.value}))} options={ACTIVITY_TYPES} />
              <Input label="Age Group" value={form.ageGroup} onChange={e => setForm(f=>({...f,ageGroup:e.target.value}))} placeholder="e.g. 4-5 years" required />
            </div>
            <Input label="Duration (minutes)" type="number" value={form.durationMins} onChange={e => setForm(f=>({...f,durationMins:Number(e.target.value)}))} min={5} max={180} required />
          </div>
        </Card>

        <Card title="Bloom's Taxonomy Levels">
          <p className="text-sm text-gray-500 mb-3">Select the cognitive levels this activity targets.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BLOOM_LEVELS.map(level => (
              <button
                key={level} type="button"
                onClick={() => toggleBloom(level)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${form.bloomLevels.includes(level) ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                style={form.bloomLevels.includes(level) ? { backgroundColor: BLOOM_COLORS[level], borderColor: BLOOM_COLORS[level] } : {}}
              >
                {BLOOM_LABELS[level]}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Learning Goals">
          <div className="space-y-2">
            {form.learningGoals.map((goal, i) => (
              <div key={i} className="flex gap-2">
                <Input className="flex-1" value={goal} onChange={e => handleGoalChange(i, e.target.value)} placeholder={`Goal ${i+1}`} />
                {form.learningGoals.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm(f => ({...f, learningGoals: f.learningGoals.filter((_, j) => j !== i)}))}>✕</Button>
                )}
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => setForm(f => ({...f, learningGoals: [...f.learningGoals, '']}))}>+ Add Goal</Button>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Create Activity</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/teacher/activities')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default TeacherActivityNew;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/teacher/ActivityNew.jsx
git commit -m "feat: add teacher activity creation page"
```

---

## Task 8: Create Teacher ActivityAssign Page

**Files:**
- Create: `client/src/pages/teacher/ActivityAssign.jsx`

The teacher assigns an activity to their own class. The page pre-fetches the teacher's classes (via `/classes` which filters by teacher via the class controller).

- [ ] **Step 1: Create the new file**

Create `client/src/pages/teacher/ActivityAssign.jsx`:

```javascript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const TeacherActivityAssign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activity, setActivity] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ classId: '', scheduledDate: '', scheduledTime: '09:00' });

  useEffect(() => {
    Promise.all([
      activityService.getById(id),
      // Teacher sees only their own class
      api.get('/classes', { params: { teacherId: user?.id } }),
    ]).then(([actRes, clsRes]) => {
      setActivity(actRes.data.data);
      const myClasses = clsRes.data.data || [];
      setClasses(myClasses);
      if (myClasses.length > 0) setForm(f => ({ ...f, classId: myClasses[0].id }));
    });
  }, [id, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // teacherId is the current logged-in teacher
      await activityService.assign(id, { ...form, teacherId: user?.id });
      navigate('/teacher/activities');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!activity) return <LoadingSpinner className="mt-20" />;

  const classOptions = classes.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Assign Activity</h1>
      <Card title={activity.title}>
        <p className="text-sm text-gray-500">{activity.description}</p>
      </Card>
      {classes.length === 0 ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          You are not assigned to any class yet. Ask your center manager to assign you to a class first.
        </div>
      ) : (
        <Card title="Assignment Details">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Class" value={form.classId} onChange={e => setForm(f=>({...f,classId:e.target.value}))} options={classOptions} required />
            <Input label="Scheduled Date" type="date" value={form.scheduledDate} onChange={e => setForm(f=>({...f,scheduledDate:e.target.value}))} required />
            <Input label="Scheduled Time" type="time" value={form.scheduledTime} onChange={e => setForm(f=>({...f,scheduledTime:e.target.value}))} required />
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Assign</Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default TeacherActivityAssign;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/teacher/ActivityAssign.jsx
git commit -m "feat: add teacher activity assign page scoped to teacher's own classes"
```

---

## Task 9: Restructure Teacher Activities Page (Library + Assignments)

**Files:**
- Modify: `client/src/pages/teacher/Activities.jsx`

Currently shows only `getMyAssignments()`. Restructure into two sections: Activity Library (create/assign) and My Scheduled Assignments (conduct).

- [ ] **Step 1: Rewrite the Teacher Activities page**

Replace the entire contents of `client/src/pages/teacher/Activities.jsx` with:

```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityService } from '../../services/activity.service';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge, { BloomBadge } from '../../components/common/Badge';
import { formatDate } from '../../utils/helpers';

const statusColor = { PENDING: 'yellow', IN_PROGRESS: 'blue', COMPLETED: 'green', SKIPPED: 'gray' };

const TeacherActivities = () => {
  const [library, setLibrary]       = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loadingLib, setLoadingLib]   = useState(true);
  const [loadingAssign, setLoadingAssign] = useState(true);
  const [tab, setTab] = useState('library');

  useEffect(() => {
    activityService.list({ status: 'PUBLISHED' })
      .then(({ data }) => setLibrary(data.data || []))
      .finally(() => setLoadingLib(false));

    activityService.getMyAssignments()
      .then(({ data }) => setAssignments(data.data || []))
      .finally(() => setLoadingAssign(false));
  }, []);

  const handleArchive = async (id) => {
    await activityService.archive(id);
    setLibrary(a => a.filter(x => x.id !== id));
  };

  const libraryColumns = [
    { key: 'title', label: 'Title', render: r => <span className="font-medium text-sm">{r.title}</span> },
    { key: 'activityType', label: 'Type' },
    { key: 'bloomLevels', label: "Bloom's Levels", render: r => <div className="flex flex-wrap gap-1">{r.bloomLevels?.map(l => <BloomBadge key={l} level={l} />)}</div> },
    { key: 'ageGroup', label: 'Age Group' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2 justify-end">
        <Link to={`/teacher/activities/${r.id}/assign`}>
          <Button size="sm" variant="secondary">Assign</Button>
        </Link>
        <Button size="sm" variant="danger" onClick={() => handleArchive(r.id)}>Archive</Button>
      </div>
    )},
  ];

  const assignmentColumns = [
    { key: 'activity', label: 'Activity', render: r => <span className="font-medium text-sm">{r.activity?.title}</span> },
    { key: 'class', label: 'Class', render: r => r.class?.name },
    { key: 'scheduledDate', label: 'Date', render: r => formatDate(r.scheduledDate) },
    { key: 'bloomLevels', label: "Bloom's", render: r => <div className="flex flex-wrap gap-1">{r.activity?.bloomLevels?.map(l => <BloomBadge key={l} level={l} />)}</div> },
    { key: 'status', label: 'Status', render: r => <Badge color={statusColor[r.status]}>{r.status}</Badge> },
    { key: 'actions', label: '', render: r => r.status !== 'COMPLETED' && (
      <Link to={`/teacher/activities/${r.id}/conduct`}>
        <Button size="sm">Conduct</Button>
      </Link>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <Link to="/teacher/activities/new">
          <Button>+ New Activity</Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          onClick={() => setTab('library')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'library' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
        >
          Activity Library
        </button>
        <button
          onClick={() => setTab('assignments')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'assignments' ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-800'}`}
        >
          My Schedule
        </button>
      </div>

      {tab === 'library' && (
        <Card>
          <Table columns={libraryColumns} data={library} loading={loadingLib} emptyMessage="No published activities yet. Create one to get started." />
        </Card>
      )}

      {tab === 'assignments' && (
        <Card>
          <Table columns={assignmentColumns} data={assignments} loading={loadingAssign} emptyMessage="No scheduled activities. Assign an activity from the library." />
        </Card>
      )}
    </div>
  );
};

export default TeacherActivities;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/teacher/Activities.jsx
git commit -m "feat: restructure teacher activities page into library + schedule tabs"
```

---

## Task 10: Add Teacher Activity Routes to App.jsx

**Files:**
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Add lazy imports for new teacher pages**

After the existing `TeacherConduct` lazy import (line 39 area), add:

```javascript
const TeacherActivityNew    = lazy(() => import('./pages/teacher/ActivityNew'));
const TeacherActivityAssign = lazy(() => import('./pages/teacher/ActivityAssign'));
```

- [ ] **Step 2: Add routes for new teacher pages**

After the existing teacher routes block, add:

```javascript
<Route path="/teacher/activities/new"         element={<ProtectedRoute roles={['TEACHER']}><TeacherActivityNew /></ProtectedRoute>} />
<Route path="/teacher/activities/:id/assign"  element={<ProtectedRoute roles={['TEACHER']}><TeacherActivityAssign /></ProtectedRoute>} />
```

- [ ] **Step 3: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: add teacher activity creation and assignment routes"
```

---

## Task 11: Update Teacher Sidebar

**Files:**
- Modify: `client/src/components/layout/Sidebar.jsx`

- [ ] **Step 1: Update TEACHER nav items to include activity management context**

The existing teacher nav already has `Activities` linking to `/teacher/activities`. No change needed to the link — the restructured Activities page now contains the full library + schedule. Verify the nav looks like this (no change required if already present):

```javascript
TEACHER: [
  { to: '/teacher/dashboard',   label: 'Dashboard',   icon: ICONS.dashboard },
  { to: '/teacher/activities',  label: 'Activities',  icon: ICONS.activity },
  { to: '/teacher/children',    label: 'My Children', icon: ICONS.child },
  { to: '/teacher/attendance',  label: 'Attendance',  icon: ICONS.calendar },
],
```

- [ ] **Step 2: Commit (only if sidebar was changed)**

```bash
git add client/src/components/layout/Sidebar.jsx
git commit -m "chore: verify teacher sidebar nav points to unified activities page"
```

---

## Verification Checklist

After all tasks complete, manually verify:

**SuperAdmin:**
- [ ] Log in as SUPER_ADMIN → navigates to `/sa/dashboard`
- [ ] `/sa/settings` loads a center dropdown, shows theme picker, save works and changes UI colors immediately
- [ ] `/sa/users` → Create User only offers CENTER_MANAGER, SUPER_ADMIN, PARENT options (no TEACHER)
- [ ] No activities pages in SA nav

**CENTER_MANAGER (ECCD Manager):**
- [ ] Log in as CENTER_MANAGER → navigates to `/manager/dashboard`
- [ ] Sidebar does NOT show "Activities" link
- [ ] Staff page works: can add/edit TEACHER users
- [ ] Classes, Classrooms, Children, Notifications pages all accessible
- [ ] Attempting to POST `/api/activities` directly returns 403

**TEACHER:**
- [ ] Log in as TEACHER → navigates to `/teacher/dashboard`
- [ ] Activities page shows two tabs: "Activity Library" and "My Schedule"
- [ ] "New Activity" button leads to `/teacher/activities/new` — can create and save
- [ ] "Assign" button on a library activity leads to `/teacher/activities/:id/assign` — shows teacher's classes
- [ ] "Conduct" button on a scheduled activity leads to conduct page

**Theme:**
- [ ] SA saves "Ocean" theme → sidebar/buttons turn teal immediately (no page reload needed)
- [ ] Logging in as a center user applies the saved theme automatically
