#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SMART ECCD – GitHub Repository Setup Script
# Run this from your Terminal: bash setup-github.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_NAME="smart-eccd"
DESCRIPTION="SMART ECCD – Child Care Center Management Platform powered by Bloom's Taxonomy"

echo "📁 Project: $PROJECT_DIR"
echo ""

# ── 1. Clean up any broken .git from sandbox ─────────────────────────────────
if [ -d "$PROJECT_DIR/.git" ]; then
  echo "🧹 Removing existing .git directory..."
  rm -rf "$PROJECT_DIR/.git"
fi

# ── 2. Initialize fresh git repo ─────────────────────────────────────────────
echo "🔧 Initializing git repository..."
cd "$PROJECT_DIR"
git init
git branch -m main

# ── 3. Set identity (edit these if needed) ───────────────────────────────────
git config user.name "Andy"
git config user.email "moktannima2015@gmail.com"

# ── 4. Stage all files ───────────────────────────────────────────────────────
echo "📦 Staging files..."
git add .
echo "   $(git status --short | wc -l | tr -d ' ') files staged"

# ── 5. Initial commit ────────────────────────────────────────────────────────
echo "✅ Creating initial commit..."
git commit -m "feat: initial scaffold of SMART ECCD platform

Full-stack ECCD management system powered by Bloom's Taxonomy.

Backend (Node.js + Express + Prisma + PostgreSQL):
- JWT auth with refresh token rotation + OTP password reset
- RBAC middleware for 4 roles: Super Admin, Manager, Teacher, Parent
- 12 REST API controllers (users, centers, classes, children,
  activities, performance, attendance, messages, reports, etc.)
- Bloom's Taxonomy analytics engine (radar profiles, trend analysis,
  center coverage, developmental flagging)
- Socket.io real-time notifications
- Docker Compose for local PostgreSQL

Frontend (React + Vite + TailwindCSS):
- 23 role-gated pages with lazy loading
- BloomRadarChart, TrendLineChart, BloomBarChart (Recharts)
- ConductActivity 3-step wizard
- ActivityDesigner with Bloom level picker
- Zustand state management + Axios auto token refresh
- Role-based sidebar navigation"

echo ""

# ── 6. Create GitHub repo ────────────────────────────────────────────────────
echo "🐙 Creating GitHub repository..."

if command -v gh &> /dev/null; then
  # Use GitHub CLI if available
  echo "   Using GitHub CLI (gh)..."
  gh repo create "$REPO_NAME" \
    --description "$DESCRIPTION" \
    --private \
    --source=. \
    --remote=origin \
    --push
  echo ""
  echo "✅ Repository created and pushed!"
  echo "   https://github.com/$(gh api user --jq .login)/$REPO_NAME"
else
  # Manual fallback
  echo ""
  echo "⚠️  GitHub CLI (gh) not found."
  echo ""
  echo "Option A – Install GitHub CLI (recommended):"
  echo "   brew install gh"
  echo "   gh auth login"
  echo "   Then re-run this script."
  echo ""
  echo "Option B – Create manually on GitHub.com:"
  echo "   1. Go to https://github.com/new"
  echo "   2. Repository name: $REPO_NAME"
  echo "   3. Set to Private (or Public)"
  echo "   4. Do NOT initialize with README (we already have commits)"
  echo "   5. Click 'Create repository'"
  echo "   6. Then run these commands:"
  echo ""
  echo "      git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
  echo "      git push -u origin main"
  echo ""
fi
