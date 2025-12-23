#!/usr/bin/env node

/**
 * Migration script that handles existing databases
 *
 * - Clears any stuck advisory locks
 * - Tries to deploy migrations normally
 * - If database has existing schema without migration history, baselines it first
 * - Then deploys migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Increase migration lock timeout to prevent P1002 errors (default is 10s)
process.env.PRISMA_MIGRATE_LOCK_TIMEOUT = '60000'; // 60 seconds

function exec(command) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, PRISMA_MIGRATE_LOCK_TIMEOUT: '60000' }
    });
    console.log(output);
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

async function clearAdvisoryLocks() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set, skipping lock cleanup');
    return;
  }

  console.log('🔓 Clearing any stuck advisory locks...');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();

    // Release all advisory locks
    await client.query('SELECT pg_advisory_unlock_all()');

    console.log('✅ Advisory locks cleared\n');
  } catch (error) {
    console.log(`⚠️  Could not clear locks (this is usually fine): ${error.message}\n`);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🔄 Running database migrations...\n');

  // Clear any stuck locks before attempting migration
  await clearAdvisoryLocks();

  // Try to deploy migrations
  const deployResult = exec('npx prisma migrate deploy');

  if (deployResult.success) {
    console.log('✅ Migrations deployed successfully');
    process.exit(0);
  }

  // Check if it's a baseline error
  console.log('\n⚠️  Migration deploy failed, checking if baseline is needed...');

  const errorOutput = deployResult.output + deployResult.error;

  if (errorOutput.includes('database schema is not empty') ||
      errorOutput.includes('P3005')) {

    console.log('📋 Database has existing schema, attempting to baseline...\n');

    // Get the first migration directory name
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const migrations = fs.readdirSync(migrationsDir)
      .filter(f => !f.startsWith('.') && f !== 'migration_lock.toml');

    if (migrations.length === 0) {
      console.error('❌ No migrations found');
      process.exit(1);
    }

    const firstMigration = migrations.sort()[0];
    console.log(`Marking migration as applied: ${firstMigration}\n`);

    // Mark the migration as applied without running it
    const resolveResult = exec(`npx prisma migrate resolve --applied "${firstMigration}"`);

    if (!resolveResult.success) {
      console.error('❌ Failed to baseline migration');
      process.exit(1);
    }

    console.log('✅ Baseline complete, retrying migration deploy...\n');

    // Try deploying again
    const retryResult = exec('npx prisma migrate deploy');

    if (retryResult.success) {
      console.log('✅ Migrations deployed successfully after baseline');
      process.exit(0);
    } else {
      console.error('❌ Migration deploy failed after baseline');
      console.error(retryResult.error);
      process.exit(1);
    }
  } else {
    console.error('❌ Migration failed for unknown reason:');
    console.error(errorOutput);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
