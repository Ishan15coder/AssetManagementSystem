import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaClient: PrismaClient;

// Connect to Turso in production, fall back to local SQLite for development
if (process.env.NODE_ENV === "production" && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  const adapter = new PrismaLibSQL({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  prismaClient = new PrismaClient({ adapter });
} else {
  // Use local SQLite dev.db file for local development
  prismaClient = new PrismaClient();
}

export const db = globalForPrisma.prisma || prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
