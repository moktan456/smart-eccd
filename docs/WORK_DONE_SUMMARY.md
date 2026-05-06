# SMART ECCD — Work Done Summary
_Last updated: 2026-05-06. Reference this before starting any new execution cycle._

---

## Completed Work (8 commits on `main`)

### 1. RBAC Redesign (`28265ef`)
**File:** `server/src/middleware/rbac.middleware.js`
- `CENTER_MANAGER` lost `activity:write` — can no longer create/edit/assign/archive activities
- `TEACHER` gained `activity:write` — full ownership of activity lifecycle
- `CENTER_MANAGER` gained `notification:write` explicitly

### 2. Theme Infrastructure — CSS Custom Properties (`5617075`)
**Files:**
- `client/src/utils/themes.js` — theme palette definitions + `applyTheme()` + `resolvePalette()`
- `client/tailwind.config.js` — `primary-*` colors now use `var(--color-primary-*)` not hardcoded hex
- `client/src/styles/index.css` — `:root` CSS vars default to Sneat palette

### 3. Theme Auto-Applied on Login (`56b0d24`)
**File:** `client/src/context/AuthContext.jsx`
- On user load, fetches `center.theme` + `center.themeColor` → calls `applyTheme()`
- SUPER_ADMIN (no centerId) keeps default Sneat theme

### 4. SA CenterSettings Theme Bug Fixed (`e49b63e`)
**File:** `client/src/pages/superadmin/CenterSettings.jsx`
- Was broken: relied on `user.centerId` which SUPER_ADMIN never has
- Fix: loads all centers list, SA picks which center to configure

### 5. SA Users Restricted (`da8c670`)
**File:** `client/src/pages/superadmin/Users.jsx`
- SA can only create `CENTER_MANAGER`, `SUPER_ADMIN`, `PARENT` — not `TEACHER`
- TEACHER creation belongs to the Manager (via `/manager/staff`)

### 6. Activity Management Moved from Manager → Teacher (`0370916`)
**Files:** `client/src/App.jsx`, `client/src/components/layout/Sidebar.jsx`
- Removed routes: `/manager/activities`, `/manager/activities/new`, `/manager/activities/:id/assign`
- Removed "Activities" from CENTER_MANAGER sidebar nav

### 7. Teacher Full Activity Lifecycle (`982a48a`)
**New files:**
- `client/src/pages/teacher/ActivityNew.jsx` — create new activity
- `client/src/pages/teacher/ActivityAssign.jsx` — assign to own class
**Modified:**
- `client/src/pages/teacher/Activities.jsx` — redesigned with two tabs: "Activity Library" + "My Schedule"
- `client/src/App.jsx` — added routes `/teacher/activities/new` and `/teacher/activities/:id/assign`

### 8. 5 Professional Themes with Live Preview UI (`cb0ad51`)
**Files:** `client/src/utils/themes.js`, `client/src/pages/superadmin/CenterSettings.jsx`, `client/src/styles/index.css`

Themes (selectable by SuperAdmin in `/sa/settings`):
| Theme | Value | Primary Color |
|-------|-------|---------------|
| Sneat | `sneat` | `#696CFF` — soft lavender (default) |
| Materio | `materio` | `#9155FD` — deep purple |
| Breeze | `breeze` | `#3699FF` — azure blue |
| Sage | `sage` | `#00BFA5` — teal green |
| Ember | `ember` | `#FF6B35` — warm amber |

- Each theme has a mini UI preview card (sidebar strip + stat cards)
- Live preview applies instantly on click (before saving)
- Custom hex color picker with HSL-based palette generation
- Saved theme persists to DB and auto-applies on next login

---

## Role Permissions Summary (Final State)

| Role | Owns |
|------|------|
| **SUPER_ADMIN** | Centers setup, assign manager, theme selection, create CENTER_MANAGER/PARENT accounts |
| **CENTER_MANAGER** | Add teachers (staff), add students (children), create/assign classrooms, create notifications, fees, leave, reports, calendar |
| **TEACHER** | Create activities, assign activities to own class, conduct & record activities, attendance, performance |
| **PARENT** | View child performance/attendance, messages, leave requests, fees |

---

### 9. Currency Selection + MUI X Charts (`a703052`)
**Currency:**
- `currency String? @default("USD")` added to Center model, DB pushed
- `server/src/controllers/center.controller.js` — accepts `currency` enum (USD|AUD|BTN|INR)
- `client/src/utils/currency.js` — `CURRENCIES`, `formatCurrency()`, `saveCenterCurrency()`, `getCenterCurrency()`
- `client/src/context/AuthContext.jsx` — calls `saveCenterCurrency()` on login
- `client/src/pages/superadmin/CenterSettings.jsx` — flag+symbol currency picker (4 cards: 🇺🇸$, 🇦🇺A$, 🇧🇹Nu., 🇮🇳₹)

**MUI X Charts installed:** `@mui/x-charts @mui/material @emotion/react @emotion/styled`

**New chart components:**
| Component | Chart Type | Used In |
|-----------|-----------|---------|
| `CentersBarChart.jsx` | BarChart | SA Dashboard — children+classes per center |
| `BloomPieChart.jsx` | PieChart | SA + Manager Dashboard — Bloom level breakdown |
| `AttendancePieChart.jsx` | PieChart | Manager Dashboard — present vs absent donut |
| `ActivityStatusBarChart.jsx` | BarChart | Teacher Dashboard — activity status counts |
| `AttendanceGauge.jsx` | Gauge | Teacher Dashboard — attendance % arc gauge |

**Dashboard updates:**
- SA Dashboard: added `CentersBarChart` + `BloomPieChart` alongside existing bar chart
- Manager Dashboard: added `BloomPieChart` + `AttendancePieChart` (replaced old attendance bar)
- Teacher Dashboard: added `ActivityStatusBarChart` + `AttendanceGauge` row above schedule

---

## Pending / Not Yet Done
- Nothing currently pending
- If new requests come in, check this file first to avoid re-doing completed work

---

## Key File Locations
| Purpose | Path |
|---------|------|
| RBAC permissions | `server/src/middleware/rbac.middleware.js` |
| Theme system | `client/src/utils/themes.js` |
| Theme CSS vars | `client/src/styles/index.css` |
| Theme auto-apply | `client/src/context/AuthContext.jsx` |
| SA Settings (theme UI) | `client/src/pages/superadmin/CenterSettings.jsx` |
| SA Users (restricted) | `client/src/pages/superadmin/Users.jsx` |
| App routes | `client/src/App.jsx` |
| Sidebar nav | `client/src/components/layout/Sidebar.jsx` |
| Teacher: create activity | `client/src/pages/teacher/ActivityNew.jsx` |
| Teacher: assign activity | `client/src/pages/teacher/ActivityAssign.jsx` |
| Teacher: activities page | `client/src/pages/teacher/Activities.jsx` |
