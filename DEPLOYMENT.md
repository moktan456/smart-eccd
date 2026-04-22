# SMART ECCD – Free Hosting Deployment Guide
## Stack: Supabase (DB) + Render (Backend) + Vercel (Frontend)

---

## Step 1 — Push latest code to GitHub

Run in your Mac Terminal:
```bash
cd "/Users/nimadorjimoktan/Documents/Claude/Projects/SMART ECCD"
git push origin main
```

---

## Step 2 — Set up Supabase (Free PostgreSQL Database)

> ⚠️ **IPv4 Fix:** Render's free tier is IPv4-only. Supabase's direct connection is IPv6.
> You must use the **Connection Pooler** URL for Render, and keep the direct URL only for migrations.
> The schema is already configured for this — just copy the right URLs below.

1. Go to **https://supabase.com** → Sign Up (free, no credit card)
2. Click **New Project**
   - Name: `smart-eccd`
   - Database Password: choose a strong password and **save it somewhere safe**
   - Region: pick the closest to you
3. Wait ~2 minutes for the project to provision
4. Go to **Settings → Database**

**Get URL A — Connection Pooler (for Render `DATABASE_URL`):**
- Scroll to **"Connection pooling"** section
- Mode: **Transaction**
- Copy the URI — it looks like:
  ```
  postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
  ```
- Append `?pgbouncer=true` to the end:
  ```
  postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Save as DATABASE_URL**

**Get URL B — Session Mode Pooler (for Render `DIRECT_URL`):**
- Stay in the **"Connection pooling"** section
- Change Mode to **Session**
- Copy the URI — it looks like (same host as URL A, but port **5432**):
  ```
  postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
  ```
- Do NOT append `?pgbouncer=true`
- **Save as DIRECT_URL**

> ⚠️ **Do NOT use the direct connection string** (`db.xxxx.supabase.co:5432`) for DIRECT_URL.
> Supabase's direct host is IPv6-only. Render's free tier is IPv4-only.
> Both URLs must go through the pooler host (`aws-0-xx.pooler.supabase.com`).
> - `DATABASE_URL` = pooler port **6543** (Transaction mode) + `?pgbouncer=true`
> - `DIRECT_URL` = pooler port **5432** (Session mode), no suffix

---

## Step 3 — Deploy Backend on Render

1. Go to **https://render.com** → Sign Up with GitHub (free)
2. Click **New → Web Service**
3. Connect your GitHub repo: `moktan456/smart-eccd`
4. Configure:
   - **Name:** `smart-eccd-api`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Under **Environment Variables**, add these:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(paste **URL A** — the pooler URL with `?pgbouncer=true`)* |
   | `DIRECT_URL` | *(paste **URL B** — the direct connection URL)* |
   | `JWT_SECRET` | *(click Generate — Render fills a random value)* |
   | `JWT_REFRESH_SECRET` | *(click Generate — Render fills a random value)* |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `UPLOAD_PROVIDER` | `local` |
   | `ENABLE_REAL_TIME` | `true` |
   | `ENABLE_EMAIL_NOTIFICATIONS` | `false` |
   | `ENABLE_PDF_REPORTS` | `false` |
   | `ENCRYPTION_KEY` | *(click Generate — Render fills a random value)* |
   | `CLIENT_URL` | *(leave blank for now — fill after Step 4)* |

6. Click **Create Web Service** — Render will build and deploy (~3 min)
7. Once deployed, copy your backend URL:
   ```
   https://smart-eccd-api.onrender.com
   ```

---

## Step 4 — Deploy Frontend on Vercel

1. Go to **https://vercel.com** → Sign Up with GitHub (free)
2. Click **Add New → Project**
3. Import your GitHub repo: `moktan456/smart-eccd`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://smart-eccd-api.onrender.com` *(your Render URL)* |

6. Click **Deploy** — takes ~1 minute
7. Your frontend is live at:
   ```
   https://smart-eccd.vercel.app  (or similar)
   ```

---

## Step 5 — Connect Frontend URL back to Backend (CORS)

1. Go back to **Render dashboard → smart-eccd-api → Environment**
2. Update `CLIENT_URL` to your Vercel URL:
   ```
   https://smart-eccd.vercel.app
   ```
3. Render will automatically redeploy with the new value

---

## Your Live App

| Service | URL |
|---------|-----|
| Frontend | `https://smart-eccd.vercel.app` |
| Backend API | `https://smart-eccd-api.onrender.com` |
| Health check | `https://smart-eccd-api.onrender.com/health` |

---

## Demo Accounts (auto-seeded on deploy)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@smart-eccd.com | Admin@1234 |
| Center Manager | manager@brightstart.com | Manager@1234 |
| Teacher | teacher@brightstart.com | Teacher@1234 |
| Parent | parent@example.com | Parent@1234 |

---

## Important Notes

- **Render free tier** spins down after 15 minutes of inactivity. The first request after idle takes ~30 seconds to wake up. For demos, open the health check URL first to wake it: `https://smart-eccd-api.onrender.com/health`
- **Supabase free tier** pauses after 1 week of inactivity — just click "Resume" in the dashboard if it pauses
- Both services auto-redeploy whenever you push to `main` on GitHub
