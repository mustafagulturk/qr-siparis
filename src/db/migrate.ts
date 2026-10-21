import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "./index";

async function main() {
  const db = createDb();
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Veritabanı güncel.");
  await db.$client.end();
}

main();
