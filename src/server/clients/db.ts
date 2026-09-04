import { PrismaClient } from "~/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "~/env";

// Re-exported so the intelligence engine can reach Prisma types/helpers through
// its single db gateway (used by the linker and extractor for typed rows + Json).
export { Prisma } from "~/generated/prisma/client";
export type { FounderMemory as FounderMemoryRecord } from "~/generated/prisma/client";

function isLocalhost(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

const createPrismaClient = () => {
  const isLocal = isLocalhost(env.DATABASE_URL);
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

const globalForPrisma = globalThis as typeof globalThis & {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
