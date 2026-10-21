import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { orderItems, orders, products, tables, type OrderStatus } from "@/db/schema";
import { publishOrderEvent } from "./events";
import { ACTIVE_STATUSES, canTransition } from "./status";

export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export const createOrderSchema = z.object({
  tableToken: z.string().min(1),
  note: z.string().max(300).default(""),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, "Sepet boş")
    .max(50),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/**
 * Müşteri siparişini oluşturur. Fiyatlar istemciden değil veritabanından alınır,
 * böylece kimse fiyatı değiştirerek sipariş veremez.
 */
export async function createOrder(db: Db, input: CreateOrderInput) {
  const table = await db.query.tables.findFirst({ where: eq(tables.token, input.tableToken) });
  if (!table || !table.isActive) throw new OrderError("Masa bulunamadı", 404);

  // Aynı ürün sepete iki kez eklendiyse birleştir
  const quantities = new Map<number, number>();
  for (const { productId, quantity } of input.items) {
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }

  const found = await db.query.products.findMany({
    where: inArray(products.id, [...quantities.keys()]),
  });
  if (found.length !== quantities.size) throw new OrderError("Menüde olmayan bir ürün var");
  const unavailable = found.find((p) => !p.isAvailable);
  if (unavailable) throw new OrderError(`${unavailable.name} şu an servis edilemiyor`);

  const lines = found.map((p) => ({
    productId: p.id,
    name: p.name,
    unitPrice: p.price,
    quantity: quantities.get(p.id)!,
  }));
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const order = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({ tableId: table.id, note: input.note.trim(), total })
      .returning();
    await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: created.id })));
    return created;
  });

  publishOrderEvent({ type: "created", orderId: order.id, status: order.status });
  return order;
}

export async function updateOrderStatus(db: Db, orderId: string, to: OrderStatus) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new OrderError("Sipariş bulunamadı", 404);
  if (!canTransition(order.status, to)) {
    throw new OrderError(`Sipariş "${order.status}" durumundan "${to}" durumuna geçemez`, 409);
  }

  // Aynı anda iki kişi güncellerse yalnızca biri başarılı olsun
  const [updated] = await db
    .update(orders)
    .set({ status: to, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, order.status)))
    .returning();
  if (!updated) throw new OrderError("Sipariş bu sırada başka biri tarafından güncellendi", 409);

  publishOrderEvent({ type: "status", orderId, status: to });
  return updated;
}

export function getOrder(db: Db, orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true, table: { columns: { name: true } } },
  });
}

export function getActiveOrders(db: Db) {
  return db.query.orders.findMany({
    where: inArray(orders.status, ACTIVE_STATUSES),
    with: { items: true, table: { columns: { name: true } } },
    orderBy: [desc(orders.createdAt)],
  });
}

export type OrderWithItems = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
