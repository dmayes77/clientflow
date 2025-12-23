#!/usr/bin/env node

/**
 * Utility to clear stuck PostgreSQL advisory locks
 * Run this manually if migrations keep timing out
 * Uses direct database connection (not pooler) for more reliable lock management
 */

const { Client } = require('pg');

async function clearLocks() {
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  // If using Neon pooler, convert to direct connection
  if (databaseUrl.includes('-pooler.')) {
    databaseUrl = databaseUrl.replace('-pooler.', '.');
    console.log('🔄 Using direct database connection (non-pooler)\n');
  }

  console.log('🔓 Connecting to database...');

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Check for existing locks
    console.log('🔍 Checking for advisory locks...');
    const locksResult = await client.query(`
      SELECT locktype, database, classid, objid, pid
      FROM pg_locks
      WHERE locktype = 'advisory'
    `);

    if (locksResult.rows.length === 0) {
      console.log('✅ No advisory locks found\n');
    } else {
      console.log(`⚠️  Found ${locksResult.rows.length} advisory lock(s):`);
      console.table(locksResult.rows);
      console.log('');

      // Get the PIDs holding the locks
      const pids = locksResult.rows.map(row => row.pid);

      // Terminate sessions holding advisory locks
      console.log('🔓 Terminating sessions holding advisory locks...');
      for (const pid of pids) {
        try {
          await client.query('SELECT pg_terminate_backend($1)', [pid]);
          console.log(`  ✅ Terminated session ${pid}`);
        } catch (err) {
          console.log(`  ⚠️  Could not terminate session ${pid}: ${err.message}`);
        }
      }
      console.log('✅ All lock-holding sessions terminated\n');
    }

    console.log('✨ Done! You can now retry your migration.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

clearLocks();
