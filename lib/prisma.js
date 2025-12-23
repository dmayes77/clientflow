import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  // Add connection pooling parameters to prevent P1002 timeout errors
  const databaseUrl = process.env.DATABASE_URL;
  const pooledUrl = databaseUrl?.includes("?")
    ? `${databaseUrl}&connection_limit=10&pool_timeout=20`
    : `${databaseUrl}?connection_limit=10&pool_timeout=20`;

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: pooledUrl,
      },
    },
  });
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export { prisma };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Ensure proper cleanup on process termination
if (process.env.NODE_ENV === "production") {
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
