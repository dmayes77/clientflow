#!/usr/bin/env node

/**
 * Clear stuck Prisma migration advisory locks
 *
 * Run this if you get P1002 errors during migration:
 * node scripts/clear-migration-locks.js
 */

const { PrismaClient } = require('@prisma/client');

async function clearLocks() {
  const prisma = new PrismaClient();

  try {
    console.log('🔓 Checking for stuck advisory locks...\n');

    // Query to find all advisory locks
    const locks = await prisma.$queryRaw`
      SELECT
        locktype,
        database,
        relation,
        page,
        tuple,
        virtualxid,
        transactionid,
        classid,
        objid,
        objsubid,
        virtualtransaction,
        pid,
        mode,
        granted
      FROM pg_locks
      WHERE locktype = 'advisory'
    `;

    if (locks.length === 0) {
      console.log('✅ No advisory locks found - database is clear\n');
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log(`Found ${locks.length} advisory lock(s):`);
    console.log(locks);
    console.log('');

    // Release all advisory locks
    console.log('🔓 Releasing advisory locks...\n');

    await prisma.$executeRaw`SELECT pg_advisory_unlock_all()`;

    console.log('✅ All advisory locks released\n');
    console.log('You can now retry your migration with: npm run build\n');

  } catch (error) {
    console.error('❌ Error clearing locks:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearLocks();
