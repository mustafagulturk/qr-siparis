import { and, asc, desc, eq, gte, ne, sql } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories, orderItems, orders, products, tables } from "@/db/schema";
import { MenuClient } from "./menu-client";

export const metadata: Metadata = { title: "Menü" };
export const dynamic = "force-dynamic";

export default async function MenuPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const table = await db.query.tables.findFirst({ where: eq(tables.token, token) });
  if (!table || !table.isActive) notFound();

  const menu = await db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder)],
    with: { products: { orderBy: [asc(products.sortOrder)] } },
  });

  // Son 7 günün en çok satan 3 ürünü "Popüler" rozeti alır
  const popular = await db
    .select({ id: orderItems.productId })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(gte(orders.createdAt, sql`now() - interval '7 days'`), ne(orders.status, "cancelled")))
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(3);

  return (
    <MenuClient
      tableName={table.name}
      tableToken={token}
      menu={menu.filter((c) => c.products.length)}
      popular={popular.map((p) => p.id).filter((id): id is number => id !== null)}
    />
  );
}
