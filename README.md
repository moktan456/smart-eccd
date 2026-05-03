# SMART ECCD v2.0

### Smart Management and Assessment Resource Tool for Early Childhood Care and Development

A full-stack web application for managing ECCD centers, tracking student learning using Bloom's Taxonomy, handling attendance, fees, leave, and communication between managers, teachers, and parents.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites Installation](#prerequisites-installation)
5. [Application Setup](#application-setup)
6. [Database Setup](#database-setup)
7. [Environment Configuration](#environment-configuration)
8. [Running the Application](#running-the-application)
9. [Production Deployment (Ubuntu Server)](#production-deployment-ubuntu-server)
10. [Cloudflare Tunnel Setup](#cloudflare-tunnel-setup)
11. [Default Credentials](#default-credentials)
12. [Role Overview](#role-overview)
13. [Common Issues & Fixes](#common-issues--fixes)
14. [Free Cloud Deployment: Render + Vercel + Neon](#free-cloud-deployment-render--vercel--neon)

---

## System Requirements

| Component  | Minimum          | Recommended      |
| ---------- | ---------------- | ---------------- |
| OS         | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS |
| CPU        | 2 cores          | 4 cores          |
| RAM        | 2 GB             | 4 GB             |
| Disk       | 10 GB            | 20 GB            |
| Node.js    | v18.x            | v20.x LTS        |
| PostgreSQL | 14               | 15               |

---

## Tech Stack

**Backend**

- Node.js 20 + Express.js
- Prisma ORM (PostgreSQL)
- JSON Web Tokens (JWT) with httpOnly cookies
- Zod for request validation
- Socket.io for real-time notifications
- Bcrypt for password hashing

**Frontend**

- React 18 + Vite
- TailwindCSS
- React Router v6
- Zustand (state management)
- Recharts (data visualization)
- Axios

---

## Project Structure

```
SMART ECCD/
├── server/                  # Backend (Node.js + Express)
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── seed.js          # Initial seed data
│   │   └── migrations/      # Database migrations
│   ├── src/
│   │   ├── config/          # DB, env config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, RBAC, error handling
│   │   ├── routes/          # API routes
│   │   └── utils/           # Helpers
│   ├── .env                 # Backend environment variables
│   └── package.json
├── client/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/           # Page components (by role)
│   │   ├── components/      # Shared UI components
│   │   ├── store/           # Zustand stores
│   │   └── utils/           # Helper functions
│   ├── .env                 # Frontend environment variables
│   └── package.json
└── README.md
```

---

## Prerequisites Installation

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # Should show v20.x.x
npm -v     # Should show 10.x.x
```

### 3. Install PostgreSQL 15

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
psql --version    # Should show psql (PostgreSQL) 15.x
```

### 4. Install Git

```bash
sudo apt install -y git
git --version
```

---

## Application Setup

### 1. Clone the Repository

```bash
cd /var/www
sudo git clone https://github.com/moktan456/smart-eccd.git
sudo chown -R $USER:$USER smart-eccd
cd smart-eccd
```


### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

## Database Setup

### 1. Create PostgreSQL User and Database

```bash
sudo -u postgres psql
```

Inside the PostgreSQL shell, run:

```sql
-- Create application user
CREATE USER smart_eccd WITH PASSWORD 'smart_eccd_pass';

-- Create the database
CREATE DATABASE smart_eccd OWNER smart_eccd;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE smart_eccd TO smart_eccd;

-- Connect to the database and grant schema permissions
\c smart_eccd
GRANT ALL ON SCHEMA public TO smart_eccd;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO smart_eccd;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO smart_eccd;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO smart_eccd;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO smart_eccd;

-- Exit PostgreSQL
\q
```

> **Important for PostgreSQL 15+:** The `GRANT ALL ON SCHEMA public` step is required. PostgreSQL 15 changed the default permissions on the public schema and without this grant, migrations will fail with "permission denied for schema public".

### 2. Verify Connection

```bash
psql -U smart_eccd -d smart_eccd -h localhost
# Enter password: smart_eccd_pass
\q
```

---

## Environment Configuration

### Backend `.env`

Create the file at `server/.env`:

```bash
nano server/.env
```

Paste the following (update values as needed):

```env
# Server
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL="postgresql://smart_eccd:smart_eccd_pass@localhost:5432/smart_eccd"

# JWT Secrets (use strong random strings in production)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key_change_this_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cookie settings
COOKIE_SECURE=false       # Set to true if using HTTPS
COOKIE_SAME_SITE=lax

# CORS
CLIENT_URL=http://localhost:5173   # For development
# CLIENT_URL=https://your-domain.com  # For production
```

> **Security Note:** Never commit `.env` to version control. Use strong, unique secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET` in production. You can generate them with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### Frontend `.env`

Create the file at `client/.env`:

```bash
nano client/.env
```

```env
# For development
VITE_API_URL=http://localhost:5000/api

# For production (if using Cloudflare tunnel or custom domain)
# VITE_API_URL=https://your-domain.com/api
```

---

## Running the Application

### Development Mode (Local)

**Terminal 1 — Start Backend:**

```bash
cd server
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 — Start Frontend:**

```bash
cd client
npm run dev
# Frontend starts at http://localhost:5173
```

Visit `http://localhost:5173` in your browser.

---

## Database Migration & Seeding

After setting up the environment, run these commands from the `server/` directory:

### 1. Generate Prisma Client

```bash
cd server
npx prisma generate
```

### 2. Run Migrations

```bash
npx prisma migrate deploy
```

This applies all database migrations and creates the required tables.

### 3. Seed Initial Data

```bash
node prisma/seed.js
```

This creates:

- A Super Admin account
- A sample ECCD Center
- A Center Manager account
- A sample Teacher
- A sample Child record (Student ID: STU-2026-0001)

---

## Production Deployment (Ubuntu Server)

### 1. Build Frontend

```bash
cd client
npm run build
```

This compiles the React app into `client/dist/`. The backend serves these static files.

### 2. Verify Backend Serves Static Files

The backend (`server/src/index.js`) should be configured to serve the built frontend:

```javascript
// Serve built frontend
app.use(express.static(path.join(__dirname, "../../client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
});
```

### 3. Create Systemd Service

Create a service file so the app starts automatically on reboot:

```bash
sudo nano /etc/systemd/system/smart-eccd.service
```

Paste:

```ini
[Unit]
Description=SMART ECCD Application
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/smart-eccd/server
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=smart-eccd
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

> **Note:** Replace `ubuntu` with your actual server username. Replace the `WorkingDirectory` path with your actual installation path.

### 4. Enable and Start the Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable smart-eccd
sudo systemctl start smart-eccd
sudo systemctl status smart-eccd
```

### 5. Useful Service Commands

```bash
# Check status
sudo systemctl status smart-eccd

# Restart (after code updates)
sudo systemctl restart smart-eccd

# Stop the service
sudo systemctl stop smart-eccd

# View live logs
sudo journalctl -u smart-eccd -f

# View last 100 lines of logs
sudo journalctl -u smart-eccd -n 100
```

### 6. Updating the Application

When you push new code to the server:

```bash
cd /var/www/smart-eccd

# Pull latest code
git pull origin main

# Install any new dependencies
cd server && npm install
cd ../client && npm install

# Rebuild frontend
cd client && npm run build

# Apply any new database migrations
cd ../server && npx prisma migrate deploy

# Restart the service
sudo systemctl restart smart-eccd
```

---

## Cloudflare Tunnel Setup

Cloudflare Tunnel gives your app a public HTTPS URL without opening firewall ports.

### 1. Install cloudflared

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
cloudflared --version
```

### 2. Authenticate

```bash
cloudflared tunnel login
```

This opens a browser link — log in with your Cloudflare account and authorize.

### 3. Create a Tunnel

```bash
cloudflared tunnel create smart-eccd
```

Note the Tunnel ID shown in the output.

### 4. Configure the Tunnel

```bash
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/ubuntu/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: your-subdomain.your-domain.com
    service: http://localhost:5000
  - service: http_status:404
```

### 5. Add DNS Record

```bash
cloudflared tunnel route dns smart-eccd your-subdomain.your-domain.com
```

### 6. Run as a Service

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### 7. Update Environment Variables

Once you have your public URL, update:

**`server/.env`:**

```env
CLIENT_URL=https://your-subdomain.your-domain.com
COOKIE_SECURE=true
```

**`client/.env`:**

```env
VITE_API_URL=https://your-subdomain.your-domain.com/api
```

Then rebuild and restart:

```bash
cd /var/www/smart-eccd/client
npm run build
sudo systemctl restart smart-eccd
```

---

## Default Credentials

After seeding the database, use these credentials to log in:

| Role           | Email               | Password    |
| -------------- | ------------------- | ----------- |
| Super Admin    | admin@smarteccd.com | Admin@123   |
| Center Manager | manager@demo.com    | Manager@123 |
| Teacher        | teacher@demo.com    | Teacher@123 |

> **Important:** Change all default passwords immediately in production via the Profile page.

---

## Role Overview

| Role               | Description                  | Key Permissions                                                         |
| ------------------ | ---------------------------- | ----------------------------------------------------------------------- |
| **SUPER_ADMIN**    | System-wide administrator    | Manage centers, manage all users, system settings                       |
| **CENTER_MANAGER** | Manages a single ECCD center | Staff, children, classes, fees, leave, calendar, reports, notifications |
| **TEACHER**        | Assigned to classes          | Conduct activities, take attendance, view assigned children             |
| **PARENT**         | Child's guardian             | View child's progress, submit leave requests, receive messages          |

### Parent Self-Registration

Parents can self-register at `/register` using their child's **Student ID** (format: `STU-YYYY-NNNN`). The Student ID is assigned when the Center Manager enrolls a child and is visible in the Children management page.

---

## API Overview

The backend exposes a REST API at `/api`. Key endpoints:

| Module         | Base Path                                                                 |
| -------------- | ------------------------------------------------------------------------- |
| Authentication | `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` |
| Centers        | `GET/POST /api/centers`, `GET/PUT/DELETE /api/centers/:id`                |
| Users          | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id`                    |
| Children       | `GET/POST /api/children`, `GET/PUT /api/children/:id`                     |
| Classes        | `GET/POST /api/classes`, `GET/PUT/DELETE /api/classes/:id`                |
| Classrooms     | `GET/POST /api/classrooms`, `PUT/DELETE /api/classrooms/:id`              |
| Activities     | `GET/POST /api/activities`, `PUT /api/activities/:id`                     |
| Attendance     | `GET/POST /api/attendance`                                                |
| Fees           | `GET/POST /api/fees`, `POST /api/fees/assign`, `POST /api/fees/payments`  |
| Leave          | `GET/POST /api/leave`, `PATCH /api/leave/:id/status`                      |
| Calendar       | `GET/POST /api/calendar`, `PUT/DELETE /api/calendar/:id`                  |
| Notifications  | `GET /api/notifications`, `POST /api/notifications/broadcast`             |
| Reports        | `GET /api/reports/child/:id/progress`                                     |

---

## Common Issues & Fixes

### Port Already in Use (EADDRINUSE :5000)

The systemd service is already running the app. Don't run `npm start` manually — use:

```bash
sudo systemctl restart smart-eccd
```

### Permission Denied for Schema Public (PostgreSQL 15+)

```bash
sudo -u postgres psql -d smart_eccd
GRANT ALL ON SCHEMA public TO smart_eccd;
\q
```

### Prisma Client Out of Date

After any schema change, regenerate the client:

```bash
cd server
npx prisma generate
sudo systemctl restart smart-eccd
```

### Frontend Not Reflecting Code Changes

You must rebuild the frontend after any changes:

```bash
cd client
npm run build
sudo systemctl restart smart-eccd
```

### Migration Fails with P3018

If you see a migration error about `ADD CONSTRAINT IF NOT EXISTS`, PostgreSQL does not support that syntax. The migration must use a DO block:

```sql
DO $$ BEGIN
  ALTER TABLE "YourTable" ADD CONSTRAINT "YourConstraint" ...;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
```

### Cannot Find Module / Dependency Errors

```bash
cd server && npm install
cd ../client && npm install
```

### Seed Fails with "Unknown argument studentId"

The Prisma client is outdated. Run:

```bash
cd server
npx prisma generate
node prisma/seed.js
```

### Database Connection Refused

Ensure PostgreSQL is running:

```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

Verify the `DATABASE_URL` in `server/.env` matches your PostgreSQL credentials.

---

## Logs & Monitoring

```bash
# Live application logs
sudo journalctl -u smart-eccd -f

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Check all services
sudo systemctl status smart-eccd postgresql cloudflared
```

---

## License

This project is proprietary software developed for ECCD center management. All rights reserved.

---

_SMART ECCD v2.0 — Built with Node.js, React, PostgreSQL & Prisma_

---

## Free Cloud Deployment: Render + Vercel + Neon

Deploy SMART ECCD for free using:

| Service | What it hosts | Free tier |
|---------|--------------|-----------|
| [Neon](https://neon.tech) | PostgreSQL database | 0.5 GB, always on |
| [Render](https://render.com) | Node.js backend API | 750 hrs/month |
| [Vercel](https://vercel.com) | React frontend | Unlimited, always free |

> **Render free tier note:** The free web service sleeps after 15 minutes of inactivity and takes ~30–50 seconds to wake on the first request. This is expected behavior on the free plan.

---

### Prerequisites

- GitHub account with this repository pushed (public or private)
- Accounts created at neon.tech, render.com, and vercel.com (all free, sign up with GitHub)

---

### Step 1 — Set Up the Neon Database

1. Go to [neon.tech](https://neon.tech) and click **Sign Up** (use GitHub for fastest setup)
2. Click **Create a project**, give it any name (e.g., `smart-eccd`), select the closest region, and click **Create project**
3. On the project dashboard, click **Connect** (or go to **Connection Details**)
4. Select **Connection string** tab and copy the full URL — it looks like:
   ```
   postgresql://smart_eccd_owner:XXXXXXXXXXXX@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Save this URL — you will need it in Step 2 and Step 4

> **SSL is required.** The `?sslmode=require` at the end of the Neon URL is mandatory. Do not remove it.

---

### Step 2 — Deploy the Backend on Render

1. Go to [render.com](https://render.com) and click **Get Started for Free** (sign in with GitHub)
2. Click **New +** → **Web Service**
3. Select **Connect a repository** and choose your SMART ECCD GitHub repository
4. Render will auto-detect the `render.yaml` file. If it does, click **Apply** and skip to step 6. If not, continue with the manual settings below:
   - **Name:** `smart-eccd-api`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:**
     ```
     npm install && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command:**
     ```
     node server.js
     ```
   - **Instance Type:** `Free`

5. If Render auto-detected `render.yaml`, open the service after creation, go to **Settings → Build & Deploy** and update the **Build Command** to:
   ```
   npm install && npx prisma generate && npx prisma migrate deploy
   ```
   This ensures the database schema is applied on every deploy.

6. Go to the **Environment** tab and add the following environment variables:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | *(paste your full Neon connection string from Step 1)* |
   | `JWT_SECRET` | *(click "Generate" for a random value)* |
   | `JWT_REFRESH_SECRET` | *(click "Generate" for a random value)* |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | *(leave blank for now — fill in after Step 3)* |
   | `UPLOAD_PROVIDER` | `local` |
   | `ENABLE_REAL_TIME` | `true` |
   | `ENABLE_EMAIL_NOTIFICATIONS` | `false` |
   | `ENABLE_PDF_REPORTS` | `false` |
   | `PUPPETEER_SKIP_DOWNLOAD` | `true` |

7. Click **Save Changes**, then click **Manual Deploy → Deploy latest commit**
8. Watch the build logs — the deploy is successful when you see `Server running on port ...`
9. Copy your backend URL from the top of the Render dashboard — it will look like:
   ```
   https://smart-eccd-api.onrender.com
   ```

---

### Step 3 — Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and click **Sign Up** (use GitHub)
2. Click **Add New → Project**
3. Select your SMART ECCD repository and click **Import**
4. Vercel will auto-detect Vite. Confirm or set these settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | *(your Render backend URL from Step 2, e.g. `https://smart-eccd-api.onrender.com`)* |

   > Do **not** add `/api` at the end — the app appends it automatically.

6. Click **Deploy** and wait for the build to finish (usually under 2 minutes)
7. Copy your frontend URL — it will look like:
   ```
   https://smart-eccd.vercel.app
   ```

---

### Step 4 — Connect Frontend URL to Backend

Now that you have the Vercel URL, go back to Render and update the missing environment variable:

1. Open your `smart-eccd-api` service on Render
2. Go to **Environment** tab
3. Set `CLIENT_URL` to your Vercel frontend URL (e.g., `https://smart-eccd.vercel.app`)
4. Click **Save Changes** — Render will automatically redeploy

---

### Step 5 — Seed the Database (First-Time Setup)

After the backend is deployed and running, seed the database to create the default admin accounts:

1. In your Render service dashboard, go to **Shell** (top navigation)
2. Run:
   ```bash
   node prisma/seed.js
   ```
3. You should see a success message confirming the seed data was created

Alternatively, run it locally (requires your Neon `DATABASE_URL` set in `server/.env`):

```bash
cd server
DATABASE_URL="your-neon-connection-string" node prisma/seed.js
```

This creates the default accounts listed in the [Default Credentials](#default-credentials) section above.

---

### Step 6 — Verify the Deployment

1. Open your Vercel URL in a browser
2. Log in with the Super Admin credentials:
   - **Email:** `admin@smarteccd.com`
   - **Password:** `Admin@123`
3. You should be redirected to the Super Admin dashboard

---

### Updating the App After Code Changes

Push your changes to GitHub — both Render and Vercel are connected to your repository and will automatically redeploy on every push to `main`.

If you make database schema changes (edit `schema.prisma`), the build command `npx prisma migrate deploy` will apply them automatically on the next deploy.

---

### Troubleshooting Cloud Deployment

#### Backend deploy fails with "Can't reach database server"

- Confirm the `DATABASE_URL` in Render exactly matches the Neon connection string including `?sslmode=require`
- In Neon dashboard, check that your project is **Active** (not suspended)
- Neon free projects suspend after 5 days of inactivity — click **Restore** in the Neon dashboard to wake it

#### Frontend shows "Network Error" or blank screen after login

- Confirm `VITE_API_URL` in Vercel is set to your Render URL with no trailing slash and no `/api` suffix
- Check that `CLIENT_URL` in Render matches your Vercel URL exactly (including `https://`)
- Open browser DevTools → Network tab to see what URL the frontend is calling

#### First request to backend is very slow (30–50 seconds)

This is normal for Render's free tier — the service spins down after 15 minutes of inactivity and cold-starts on the next request. Subsequent requests are fast.

#### Render build fails with "prisma: command not found"

Update the Render build command to use `npx`:
```
npm install && npx prisma generate && npx prisma migrate deploy
```

#### Neon connection works locally but fails on Render

Add `?sslmode=require` to the end of your `DATABASE_URL` if it is not already there. Neon requires SSL for all connections.

#### Vercel build fails with "Could not find root directory"

Make sure the **Root Directory** in Vercel project settings is set to `client`, not the repo root.

---

_Free tier deployment: Neon (database) + Render (backend) + Vercel (frontend)_
