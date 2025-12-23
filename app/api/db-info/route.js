import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/db-info - Check database connection and schema
export async function GET() {
  try {
    // Try to query _prisma_migrations to see migration status
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, applied_steps_count
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 5
    `;

    // Try to list all tables in public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    // Check if Plan table exists specifically
    const planTableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'Plan'
      ) as exists
    `;

    return NextResponse.json({
      databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + "...",
      migrations: migrations || [],
      tableCount: tables?.length || 0,
      tables: tables?.map(t => t.table_name) || [],
      planTableExists: planTableExists?.[0]?.exists || false,
      prismaVersion: require('@prisma/client/package.json').version,
    });
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + "...",
      stack: error.stack,
    }, { status: 500 });
  }
}
