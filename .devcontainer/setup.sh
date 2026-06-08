#!/bin/bash
set -e

echo "🔧 Setting up A.H.Helwa ERP..."

# Write .env if missing
if [ ! -f .env ]; then
  cat > .env <<EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ah_helwa_erp?schema=public"
JWT_SECRET="codespaces-dev-secret-not-for-production-change-me-please"
NEXT_PUBLIC_APP_NAME="A.H.Helwa ERP"
NEXT_PUBLIC_DEFAULT_CURRENCY="EGP"
EOF
fi

# Wait for postgres to be ready
echo "⏳ Waiting for PostgreSQL..."
for i in {1..30}; do
  if nc -z localhost 5432 2>/dev/null; then
    echo "✅ PostgreSQL is ready."
    break
  fi
  sleep 1
done

echo "📦 Installing npm dependencies..."
npm install

echo "🗄️  Generating Prisma client..."
npx prisma generate

echo "🗄️  Applying database schema..."
npx prisma db push --skip-generate --accept-data-loss

echo "🌱 Seeding demo tenant..."
npm run db:seed || true

echo ""
echo "✅ ✅ ✅  Setup complete!"
echo ""
echo "   Now run:   npm run dev"
echo "   Then open: http://localhost:3000"
echo "   Login:     slug=demo, email=admin@demo.com, password=admin123"
echo ""
