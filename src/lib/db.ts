import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

// Singleton for Next.js dev hot-reload
const db = global.__prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") global.__prisma = db;

export { db };
