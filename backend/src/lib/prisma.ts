import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// `max: 1` caps each serverless function instance to a single DB connection.
// Without this, pg.Pool defaults to 10 connections per instance — with ~20 API
// routes each bundled as a separate function, that exhausts a small connection
// limit almost immediately under any real traffic.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

globalForPrisma.prisma = prisma;
