import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories, products, tables } from "@/db/schema";
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

  return <MenuClient tableName={table.name} tableToken={token} menu={menu.filter((c) => c.products.length)} />;
}
