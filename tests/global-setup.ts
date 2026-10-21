import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export default async function setup() {
  const client = postgres(
    process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/qr_siparis_test",
    { onnotice: () => {} },
  );
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
}
