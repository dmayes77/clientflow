#!/usr/bin/env node

/**
 * Migration script that handles existing databases
 *
 * - Uses direct database connection (not pooler) for migrations
 * - Clears any stuck advisory locks
 * - Tries to deploy migrations normally
 * - If database has existing schema without migration history, baselines it first
 * - Then deploys migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Convert pooler URL to direct connection for migrations
// Neon pooler connections have stricter timeouts that can cause P1002 errors
function getDirectDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set');
    return databaseUrl;
  }

  let directUrl = databaseUrl;

  // If using Neon pooler, convert to direct connection
  if (databaseUrl.includes('-pooler.')) {
    directUrl = databaseUrl.replace('-pooler.', '.');
    console.log('🔄 Using direct database connection for migrations (non-pooler)');
  }

  // Add connection timeout parameters to the URL
  const url = new URL(directUrl);
  url.searchParams.set('connect_timeout', '300'); // 5 minutes
  url.searchParams.set('pool_timeout', '300');
  url.searchParams.set('statement_timeout', '300000'); // 5 minutes in ms

  return url.toString();
}

const DIRECT_DATABASE_URL = getDirectDatabaseUrl();

// Increase migration lock timeout to prevent P1002 errors (default is 10s)
process.env.PRISMA_MIGRATE_LOCK_TIMEOUT = '60000'; // 60 seconds

function exec(command) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      env: {
        ...process.env,
        DATABASE_URL: DIRECT_DATABASE_URL,
        PRISMA_MIGRATE_LOCK_TIMEOUT: '60000'
      }
    });
    console.log(output);
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

async function clearAdvisoryLocks() {
  if (!DIRECT_DATABASE_URL) {
    console.log('⚠️  DATABASE_URL not set, skipping lock cleanup');
    return;
  }

  console.log('🔓 Clearing any stuck advisory locks...');

  const client = new Client({
    connectionString: DIRECT_DATABASE_URL,
  });

  try {
    await client.connect();

    // Check for advisory locks
    const locksResult = await client.query(`
      SELECT pid FROM pg_locks WHERE locktype = 'advisory'
    `);

    if (locksResult.rows.length > 0) {
      console.log(`Found ${locksResult.rows.length} advisory lock(s), terminating sessions...`);

      // Terminate sessions holding advisory locks
      for (const row of locksResult.rows) {
        try {
          await client.query('SELECT pg_terminate_backend($1)', [row.pid]);
        } catch (err) {
          // Ignore errors - process might have already terminated
        }
      }
    }

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
