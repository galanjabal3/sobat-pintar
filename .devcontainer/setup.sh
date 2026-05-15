#!/bin/bash
# Post-create setup script for Sobat Pintar dev container
# Runs automatically after container is created

set -e

echo "🚀 Setting up Sobat Pintar development environment..."

# ── Fix Go permissions ─────────────────────────────────────
echo "🔧 Fixing Go directory permissions..."
sudo mkdir -p /go/pkg/mod/cache
sudo mkdir -p /go/pkg/sumdb
sudo chown -R vscode:vscode /go
sudo chmod -R 755 /go

# Set GOPATH and PATH explicitly
export GOPATH=/go
export GOROOT=/usr/local/go
export PATH=$PATH:/usr/local/go/bin:/go/bin
echo "✅ Go permissions fixed"

# ── Backend Setup ──────────────────────────────────────────
echo "📦 Installing Go dependencies..."
cd /workspace/backend
/usr/local/go/bin/go mod tidy || echo "⚠️ go mod tidy failed, skipping..."
echo "✅ Go dependencies done"

# Setup backend .env if not exists
if [ ! -f /workspace/backend/.env ]; then
  cp /workspace/backend/.env.example /workspace/backend/.env
  sed -i 's/DB_HOST=localhost/DB_HOST=postgres/' /workspace/backend/.env
  sed -i 's/DB_PASSWORD=/DB_PASSWORD=postgres123/' /workspace/backend/.env
  sed -i 's/REDIS_HOST=localhost/REDIS_HOST=redis/' /workspace/backend/.env
  echo "✅ Backend .env created from example"
fi

# ── Frontend Setup ─────────────────────────────────────────
echo "📦 Installing Node.js dependencies..."
cd /workspace/frontend

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Fix frontend permissions
sudo chown -R vscode:vscode /workspace/frontend
npm install || echo "⚠️ npm install failed, skipping..."
echo "✅ Node.js dependencies done"

# Setup frontend .env if not exists
if [ ! -f /workspace/frontend/.env.local ]; then
  cp /workspace/frontend/.env.local.example /workspace/frontend/.env.local
  echo "✅ Frontend .env.local created from example"
fi

# ── Database Setup ─────────────────────────────────────────
echo "🗄️ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if pg_isready -h postgres -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
    break
  fi
  echo "⏳ Waiting for PostgreSQL... ($i/30)"
  sleep 2
done

echo "🗄️ Running database migrations..."
cd /workspace/backend
/usr/local/go/bin/go run cmd/migrate/main.go up 2>/dev/null || echo "⚠️ Migration skipped"

# ── Done ───────────────────────────────────────────────────
echo ""
echo "✅ Sobat Pintar dev environment is ready!"
echo ""
echo "📋 Quick start:"
echo "   Backend:  cd /workspace/backend && go run cmd/server/main.go"
echo "   Frontend: cd /workspace/frontend && npm run dev"
echo ""
echo "🌐 Ports:"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8080"
echo ""