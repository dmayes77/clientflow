#!/bin/bash

# Migration script that handles existing databases
# Tries to deploy migrations, and if database has existing schema without migration history,
# baselines it first then deploys

# Increase migration lock timeout to prevent P1002 errors (default is 10s)
export PRISMA_MIGRATE_LOCK_TIMEOUT=60000

echo "Running database migrations..."

# Try to deploy migrations
if npx prisma migrate deploy; then
  echo "✅ Migrations deployed successfully"
  exit 0
fi

# If deploy failed, check if it's a baseline error
echo "⚠️  Migration deploy failed, checking if baseline is needed..."

# Check if the error is about existing schema
if npx prisma migrate status 2>&1 | grep -q "database schema is not empty"; then
  echo "📋 Database has existing schema, attempting to baseline..."

  # Get the first migration name
  MIGRATION=$(ls -1 prisma/migrations | head -1)

  if [ -z "$MIGRATION" ]; then
    echo "❌ No migrations found"
    exit 1
  fi

  echo "Marking migration as applied: $MIGRATION"

  # Mark the migration as applied without running it
  npx prisma migrate resolve --applied "$MIGRATION"

  echo "✅ Baseline complete, retrying migration deploy..."

  # Try deploying again
  npx prisma migrate deploy

  if [ $? -eq 0 ]; then
    echo "✅ Migrations deployed successfully after baseline"
    exit 0
  else
    echo "❌ Migration deploy failed after baseline"
    exit 1
  fi
else
  echo "❌ Migration failed for unknown reason"
  exit 1
fi
