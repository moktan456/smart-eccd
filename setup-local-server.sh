#!/bin/bash
# ============================================================
# SMART ECCD – Full Local Server Setup
# Run once on your Ubuntu VM:  bash setup-local-server.sh
# ============================================================

set -e  # Exit immediately on any error
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_NAME="smart_eccd"
DB_USER="smart_eccd"
DB_PASS="smart_eccd_pass"

echo ""
echo "======================================"
echo "   SMART ECCD – Local Server Setup"
echo "======================================"
echo ""

# ── 1. System packages ────────────────────────────────────────
log "Updating system packages..."
sudo apt-get update -qq

# ── 2. Node.js 20 ─────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 20 ]]; then
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -qq
  sudo apt-get install -y nodejs -qq
else
  log "Node.js $(node -v) already installed"
fi

# ── 3. PostgreSQL ─────────────────────────────────────────────
if ! command -v psql &>/dev/null; then
  log "Installing PostgreSQL..."
  sudo apt-get install -y postgresql postgresql-contrib -qq
  sudo systemctl enable postgresql
  sudo systemctl start postgresql
else
  log "PostgreSQL already installed"
  sudo systemctl start postgresql 2>/dev/null || true
fi

# ── 4. Create DB user and database ───────────────────────────
log "Setting up database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};" -q
log "Database '${DB_NAME}' ready"

# ── 5. Generate secure secrets ────────────────────────────────
log "Generating secure secrets..."
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)

# ── 6. Write .env ─────────────────────────────────────────────
log "Writing server/.env..."
cat > "${REPO_DIR}/server/.env" << EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
UPLOAD_PROVIDER=local
ENABLE_REAL_TIME=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_PDF_REPORTS=false
ENCRYPTION_KEY=${ENCRYPTION_KEY}
EOF

# ── 7. Install server dependencies ────────────────────────────
log "Installing backend dependencies..."
cd "${REPO_DIR}/server"
PUPPETEER_SKIP_DOWNLOAD=true npm install --omit=dev --silent

# ── 8. Generate Prisma client + run migrations + seed ─────────
log "Running database migrations..."
npx prisma generate
npx prisma migrate deploy
log "Seeding demo accounts..."
node prisma/seed.js

# ── 9. Build React frontend ───────────────────────────────────
log "Installing frontend dependencies..."
cd "${REPO_DIR}/client"
npm install --silent

log "Building React frontend..."
npm run build

log "Frontend built → server/src/../../client/dist"

# ── 10. Install cloudflared ───────────────────────────────────
if ! command -v cloudflared &>/dev/null; then
  log "Installing cloudflared..."
  ARCH=$(dpkg --print-architecture)
  wget -q "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" \
    -O /tmp/cloudflared.deb
  sudo dpkg -i /tmp/cloudflared.deb
else
  log "cloudflared already installed"
fi

# ── 11. Create systemd service for the app ────────────────────
log "Creating systemd service..."
sudo tee /etc/systemd/system/smart-eccd.service > /dev/null << EOF
[Unit]
Description=SMART ECCD Application Server
After=network.target postgresql.service

[Service]
Type=simple
User=${USER}
WorkingDirectory=${REPO_DIR}/server
ExecStart=/usr/bin/node ${REPO_DIR}/server/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable smart-eccd
sudo systemctl restart smart-eccd

sleep 2
if sudo systemctl is-active --quiet smart-eccd; then
  log "smart-eccd service is running"
else
  err "Service failed to start. Check: sudo journalctl -u smart-eccd -n 50"
fi

# ── 12. Create cloudflare tunnel startup script ───────────────
cat > "${REPO_DIR}/start-tunnel.sh" << 'EOF'
#!/bin/bash
echo "Starting Cloudflare Tunnel..."
echo "Your public URL will appear below in ~5 seconds."
echo "Share it with your client for testing."
echo "Press Ctrl+C to stop."
echo ""
cloudflared tunnel --url http://localhost:5000
EOF
chmod +x "${REPO_DIR}/start-tunnel.sh"

# ── Done ──────────────────────────────────────────────────────
echo ""
echo "======================================"
echo -e "${GREEN}   Setup complete!${NC}"
echo "======================================"
echo ""
echo "  Local app:    http://localhost:5000"
echo "  Health check: http://localhost:5000/health"
echo ""
echo "  Demo accounts:"
echo "    Super Admin : superadmin@smart-eccd.com / Admin@1234"
echo "    Manager     : manager@brightstart.com   / Manager@1234"
echo "    Teacher     : teacher@brightstart.com   / Teacher@1234"
echo "    Parent      : parent@example.com        / Parent@1234"
echo ""
echo -e "${YELLOW}  To get a public URL, run:${NC}"
echo "    bash ${REPO_DIR}/start-tunnel.sh"
echo ""
