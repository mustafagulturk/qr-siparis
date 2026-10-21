import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { reviews, orders, serviceRequests, tables, serviceTypeEnum } from "@/db/schema";
import { publishServiceEvent } from "./events";
import { OrderError } from "./orders";

export const serviceSchema = z.object({
  tableToken: z.string().min(1),
  type: z.enum(serviceTypeEnum.enumValues),
});

/**
 * Garson çağırma / hesap isteme. Aynı masanın aynı türde açık bir isteği
 * varsa yenisi oluşturulmaz; müşteri butona tekrar tekrar bassa da personel
 * tek bildirim görür.
 */
export async function createServiceRequest(db: Db, input: z.infer<typeof serviceSchema>) {
  const table = await db.query.tables.findFirst({ where: eq(tables.token, input.tableToken) });
  if (!table || !table.isActive) throw new OrderError("Masa bulunamadı", 404);

  const open = await db.query.serviceRequests.findFirst({
    where: and(
      eq(serviceRequests.tableId, table.id),
      eq(serviceRequests.type, input.type),
      isNull(serviceRequests.resolvedAt),
    ),
  });
  if (open) return { request: open, duplicate: true };

  const [request] = await db.insert(serviceRequests).values({ tableId: table.id, type: input.type }).returning();
  publishServiceEvent({
    type: "service",
    requestId: request.id,
    tableName: table.name,
    service: request.type,
    resolved: false,
  });
  return { request, duplicate: false };
}

export async function resolveServiceRequest(db: Db, id: number) {
  const [request] = await db
    .update(serviceRequests)
    .set({ resolvedAt: new Date() })
    .where(and(eq(serviceRequests.id, id), isNull(serviceRequests.resolvedAt)))
    .returning();
  if (!request) throw new OrderError("Çağrı bulunamadı veya zaten kapatıldı", 404);
  const table = await db.query.tables.findFirst({ where: eq(tables.id, request.tableId) });
  publishServiceEvent({
    type: "service",
    requestId: id,
    tableName: table?.name ?? "",
    service: request.type,
    resolved: true,
  });
  return request;
}

export function getOpenServiceRequests(db: Db) {
  return db.query.serviceRequests.findMany({
    where: isNull(serviceRequests.resolvedAt),
    with: { table: { columns: { name: true } } },
    orderBy: [asc(serviceRequests.createdAt)],
  });
}

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "1 ile 5 arasında puan verin").max(5, "1 ile 5 arasında puan verin"),
  comment: z.string().trim().max(500).default(""),
});

/** Müşteri, siparişi hazır veya teslim edildikten sonra bir kez değerlendirebilir. */
export async function createReview(db: Db, orderId: string, input: z.infer<typeof reviewSchema>) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw new OrderError("Sipariş bulunamadı", 404);
  if (order.status !== "served" && order.status !== "ready") {
    throw new OrderError("Sipariş henüz hazır olmadan değerlendirme yapılamaz");
  }
  const [review] = await db
    .insert(reviews)
    .values({ orderId, rating: input.rating, comment: input.comment })
    .onConflictDoNothing()
    .returning();
  if (!review) throw new OrderError("Bu sipariş zaten değerlendirildi", 409);
  return review;
}
