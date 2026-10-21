"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import { categories, products, tables } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { parseTL } from "@/lib/money";

export type ActionResult = { error?: string; ok?: boolean } | null;

const productSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, "Ürün adı en az 2 karakter olmalı").max(80),
  description: z.string().trim().max(200).default(""),
  emoji: z.string().trim().max(8).default("🍽️"),
  price: z.string(),
});

const newToken = () => randomBytes(9).toString("base64url");

export async function addCategory(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireRole("admin");
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Kategori adı en az 2 karakter olmalı" };
  const count = await db.$count(categories);
  await db.insert(categories).values({ name, sortOrder: count });
  revalidatePath("/yonetim/menu");
  return { ok: true };
}

export async function deleteCategory(id: number) {
  await requireRole("admin");
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/yonetim/menu");
}

export async function saveProduct(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireRole("admin");
  const parsed = productSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const price = parseTL(parsed.data.price);
  if (price === null || price === 0) return { error: "Geçerli bir fiyat girin (örn: 125,50)" };

  const values = { ...parsed.data, emoji: parsed.data.emoji || "🍽️", price };
  const id = Number(form.get("id"));
  if (id) await db.update(products).set(values).where(eq(products.id, id));
  else await db.insert(products).values(values);

  revalidatePath("/yonetim/menu");
  return { ok: true };
}

export async function toggleProduct(id: number, isAvailable: boolean) {
  await requireRole("admin");
  await db.update(products).set({ isAvailable }).where(eq(products.id, id));
  revalidatePath("/yonetim/menu");
}

export async function deleteProduct(id: number) {
  await requireRole("admin");
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/yonetim/menu");
}

export async function addTable(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireRole("admin");
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Masa adı girin" };
  await db.insert(tables).values({ name, token: newToken() });
  revalidatePath("/yonetim/masalar");
  return { ok: true };
}

export async function toggleTable(id: number, isActive: boolean) {
  await requireRole("admin");
  await db.update(tables).set({ isActive }).where(eq(tables.id, id));
  revalidatePath("/yonetim/masalar");
}

/** QR kodun fotoğrafı paylaşıldıysa eski kodu geçersiz kılar. */
export async function regenerateToken(id: number) {
  await requireRole("admin");
  await db.update(tables).set({ token: newToken() }).where(eq(tables.id, id));
  revalidatePath("/yonetim/masalar");
}
