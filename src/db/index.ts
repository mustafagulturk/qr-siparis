import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL tanımlı değil. .env.example dosyasına bakın.");
  const client = postgres(url, {
    max: 10,
    connection: { TimeZone: process.env.APP_TIMEZONE ?? "Europe/Istanbul" },
  });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

// Geliştirme sırasında hot reload her seferinde yeni bağlantı açmasın
const globalForDb = globalThis as unknown as { db?: Db };
export const db = globalForDb.db ?? createDb();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
