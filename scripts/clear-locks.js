#!/usr/bin/env node

/**
 * Utility to clear stuck PostgreSQL advisory locks
 * Run this manually if migrations keep timing out
 */

const { Client } = require('pg');

async function clearLocks() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
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

      // Release all advisory locks
      console.log('🔓 Releasing all advisory locks...');
      await client.query('SELECT pg_advisory_unlock_all()');
      console.log('✅ All advisory locks released\n');
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
