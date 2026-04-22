# SMART ECCD – Getting Started

## Prerequisites
- Node.js 20 LTS
- Docker Desktop (for local PostgreSQL)
- npm 9+

---

## 1. Install dependencies

```bash
# From the project root
npm install
cd server && npm install
cd ../client && npm install
```

---

## 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env` — the defaults work for local Docker development without changes.

---

## 3. Start the database

```bash
docker compose up -d
```

This spins up PostgreSQL on port 5432.

---

## 4. Run database migrations & seed

```bash
cd server
npx prisma migrate dev --name init
npm run seed
```

This creates all tables and loads 4 demo accounts.

---

## 5. Start the application

Open two terminals:

```bash
# Terminal 1 – Backend
cd server && npm run dev

# Terminal 2 – Frontend
cd client && npm run dev
```

- **Frontend:** http://localhost:5173  
- **Backend API:** http://localhost:5000  
- **Health check:** http://localhost:5000/health

---

## Demo Accounts

| Role           | Email                          | Password      |
|----------------|-------------------------------|---------------|
| Super Admin    | superadmin@smart-eccd.com     | Admin@1234    |
| Center Manager | manager@brightstart.com       | Manager@1234  |
| Teacher        | teacher@brightstart.com       | Teacher@1234  |
| Parent         | parent@example.com            | Parent@1234   |

---

## Project Structure

```
smart-eccd/
├── client/          # React + Vite + TailwindCSS frontend
├── server/          # Node.js + Express + Prisma backend
│   ├── prisma/      # Schema, migrations, seed
│   └── src/
│       ├── config/        # DB, email, storage
│       ├── controllers/   # Route handlers
│       ├── middleware/     # Auth, RBAC, validation
│       ├── routes/        # Express routes
│       ├── services/      # Bloom engine, notifications, reports
│       ├── socket/        # Socket.io real-time
│       └── utils/         # Helpers, constants
├── docker-compose.yml
└── .env.example
```

---

## Feature Flags (in server/.env)

| Variable                    | Default | Description                     |
|-----------------------------|---------|----------------------------------|
| `ENABLE_REAL_TIME`          | `true`  | Socket.io live updates           |
| `ENABLE_EMAIL_NOTIFICATIONS`| `false` | Email via Resend                 |
| `ENABLE_PDF_REPORTS`        | `false` | PDF generation via Puppeteer     |
| `UPLOAD_PROVIDER`           | `local` | `local` or `cloudinary`          |

---

## Adding a New Module (Extensibility)

1. Add the Prisma model to `server/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_your_model`
3. Create `server/src/controllers/your.controller.js`
4. Create `server/src/routes/your.routes.js`
5. Register the route in `server/src/routes/index.js`
6. Add the client service in `client/src/services/your.service.js`
7. Add the page in `client/src/pages/`
8. Register the route in `client/src/App.jsx`
