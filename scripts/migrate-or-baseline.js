#!/usr/bin/env node

/**
 * Migration script that handles existing databases
 *
 * - Tries to deploy migrations normally
 * - If database has existing schema without migration history, baselines it first
 * - Then deploys migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function exec(command) {
  try {
    console.log(`Running: ${command}`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(output);
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

async function main() {
  console.log('🔄 Running database migrations...\n');

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
