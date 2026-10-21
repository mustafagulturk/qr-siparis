import { sql } from "drizzle-orm";
import { createDb } from "@/db";
import { categories, products, tables } from "@/db/schema";

export const db = createDb();

export async function resetDb() {
  await db.execute(sql`truncate order_items, orders, products, categories, tables, users restart identity cascade`);
}

/** Bir masa, bir kategori ve iki ürün oluşturur. */
export async function seedBasic() {
  const [table] = await db.insert(tables).values({ name: "Masa 1", token: "test-masa" }).returning();
  const [cat] = await db.insert(categories).values({ name: "Kebaplar" }).returning();
  const [kebap, ayran] = await db
    .insert(products)
    .values([
      { categoryId: cat.id, name: "Ali Nazik", price: 42000 },
      { categoryId: cat.id, name: "Ayran", price: 4000 },
    ])
    .returning();
  return { table, kebap, ayran };
}
