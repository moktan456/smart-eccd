# Cloud Deployment Session Summary

**Date:** 2026-05-04
**Project:** SMART ECCD v2.0
**Stack:** Render (backend) + Vercel (frontend) + Neon (PostgreSQL)

---

## What We Did

### 1. Chose a Free Hosting Stack

Evaluated free-tier hosting options for the project. Selected:

| Service | Role | Free Tier |
|---------|------|-----------|
| [Neon](https://neon.tech) | PostgreSQL database | 0.5 GB, always on |
| [Render](https://render.com) | Node.js backend API | 750 hrs/month, sleeps after 15 min idle |
| [Vercel](https://vercel.com) | React frontend | Unlimited, always free |

---

### 2. Added Full Deployment Guide to README.md

Appended a complete **6-step deployment guide** to the bottom of `README.md` covering:

- **Step 1 — Neon:** Create project, copy connection string (with `?sslmode=require`)
- **Step 2 — Render:** Connect GitHub repo, set all environment variables, update build command to include migrations
- **Step 3 — Vercel:** Import repo, set Root Directory to `client`, set `VITE_API_URL`
- **Step 4 — Connect:** Update `CLIENT_URL` on Render to the Vercel URL (required for CORS)
- **Step 5 — Seed:** Run seed locally pointing to Neon database
- **Step 6 — Verify:** Log in with default Super Admin credentials

Also added a **Troubleshooting** section covering common failure points (SSL, CORS, Neon suspend, Render cold starts, Vercel root directory).

---

### 3. Fixed Render Build Command

The default `render.yaml` build command only ran `prisma generate`. Updated the instructions to use:

```
npm install && npx prisma generate && npx prisma migrate deploy
```

This ensures database schema migrations are applied automatically on every deploy.

---

### 4. Updated Seed Instructions (No Render Shell on Free Tier)

Render's free tier does not include shell access. Updated Step 5 to seed the database from the local machine instead:

```bash
cd server
# Set DATABASE_URL in server/.env to the Neon connection string
npx prisma generate
node prisma/seed.js
```

Since Neon is a cloud database, the seed writes directly to it regardless of where the command is run.

---

### 5. Clarified JWT Secrets

The local `server/.env` contains placeholder JWT secrets (`change_me_to_a_long_random_secret_key`). These do **not** need to be changed for the Render deployment because `render.yaml` uses `generateValue: true`, so Render auto-generates secure random values in its own environment. The local `.env` is never uploaded.

For local development, generate proper secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 6. Fixed 404 on Page Refresh (Vercel SPA Routing)

**Problem:** Refreshing any route (e.g., `/dashboard`) returned `404: NOT_FOUND` on Vercel.

**Root cause:** The existing `vercel.json` (with the `/(.*) → /index.html` rewrite rule) was at the project root. Since Vercel's Root Directory was set to `client`, it looked for `vercel.json` inside `client/` — and didn't find it, so rewrites were never applied.

**Fix:** Created `client/vercel.json` with the rewrite rule:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `README.md` | Appended full cloud deployment guide (Steps 1–6 + Troubleshooting) |
| `client/vercel.json` | Created — SPA routing fix for Vercel page refresh 404 |

---

## Next Steps

- Push `client/vercel.json` to GitHub to trigger Vercel redeploy and fix the 404 on refresh
- Change default passwords (`Admin@123`, `Manager@123`, `Teacher@123`) after first login
- Consider upgrading Render to a paid tier ($7/month) if the 15-minute sleep becomes a problem
