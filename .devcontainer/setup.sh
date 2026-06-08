#!/bin/bash
set -e

echo "🔧 Setting up A.H.Helwa ERP in Codespaces..."

# Ensure PostgreSQL is running
sudo service postgresql start || true
sleep 2

# Create database (idempotent)
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'ah_helwa_erp'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ah_helwa_erp;"

# Set password for postgres user so the app can connect
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" || true

# Write .env if missing
if [ ! -f .env ]; then
  cat > .env <<EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ah_helwa_erp?schema=public"
JWT_SECRET="codespaces-dev-secret-not-for-production-change-me-please"
NEXT_PUBLIC_APP_NAME="A.H.Helwa ERP"
NEXT_PUBLIC_DEFAULT_CURRENCY="EGP"
EOF
fi

echo "📦 Installing npm dependencies..."
npm install

echo "🗄️  Generating Prisma client..."
npx prisma generate

echo "🗄️  Applying database schema..."
npx prisma db push --skip-generate

echo "🌱 Seeding demo tenant..."
npm run db:seed || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "   Run:   npm run dev"
echo "   Login: slug=demo, email=admin@demo.com, password=admin123"
echo ""
