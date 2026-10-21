import { and, asc, desc, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { orderItems, orders, reviews, serviceRequests, tables } from "@/db/schema";
import { ACTIVE_STATUSES } from "./status";

// Gün sınırları veritabanının saat diliminde (varsayılan Europe/Istanbul) hesaplanır
const today = sql`date_trunc('day', now())`;
const weekAgo = sql`date_trunc('day', now()) - interval '6 days'`;

export async function getDashboard(db: Db) {
  const notCancelled = ne(orders.status, "cancelled");

  const [summary] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, today), notCancelled));

  const topProducts = await db
    .select({
      name: orderItems.name,
      quantity: sql<number>`sum(${orderItems.quantity})::int`,
      revenue: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPrice})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(and(gte(orders.createdAt, weekAgo), notCancelled))
    .groupBy(orderItems.name)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5);

  // Sipariş olmayan günler de sıfır olarak listelensin diye generate_series kullanılır
  const week = await db.execute<{ day: string; revenue: number }>(sql`
    select to_char(g.day, 'YYYY-MM-DD') as day, coalesce(sum(o.total), 0)::int as revenue
    from generate_series(${weekAgo}, ${today}, interval '1 day') as g(day)
    left join ${orders} o
      on date_trunc('day', o.created_at) = g.day and o.status <> 'cancelled'
    group by g.day
    order by g.day
  `);

  const recent = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit: 8,
    with: { table: { columns: { name: true } } },
  });

  // Canlı masa haritası: her masanın aktif siparişleri ve bekleyen çağrıları
  const [allTables, active, openRequests] = await Promise.all([
    db.query.tables.findMany({ where: sql`${tables.isActive}`, orderBy: [asc(tables.id)] }),
    db
      .select({
        tableId: orders.tableId,
        count: sql<number>`count(*)::int`,
        total: sql<number>`sum(${orders.total})::int`,
        oldest: sql<Date>`min(${orders.createdAt})`,
      })
      .from(orders)
      .where(inArray(orders.status, ACTIVE_STATUSES))
      .groupBy(orders.tableId),
    db.select().from(serviceRequests).where(isNull(serviceRequests.resolvedAt)),
  ]);
  const tableMap = allTables.map((t) => {
    const a = active.find((x) => x.tableId === t.id);
    return {
      id: t.id,
      name: t.name,
      activeOrders: a?.count ?? 0,
      openTotal: a?.total ?? 0,
      since: a?.oldest ? new Date(a.oldest) : null,
      requests: openRequests.filter((r) => r.tableId === t.id).map((r) => r.type),
    };
  });

  const [ratingSummary] = await db
    .select({
      average: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(gte(reviews.createdAt, sql`now() - interval '30 days'`));
  const latestReviews = await db.query.reviews.findMany({
    orderBy: [desc(reviews.createdAt)],
    limit: 4,
    with: { order: { columns: { number: true }, with: { table: { columns: { name: true } } } } },
  });

  return {
    tableMap,
    rating: { ...ratingSummary, latest: latestReviews },
    revenue: summary.revenue,
    count: summary.count,
    average: summary.count ? Math.round(summary.revenue / summary.count) : 0,
    topProducts,
    week: [...week].map((w) => ({ day: new Date(`${w.day}T12:00:00`), revenue: w.revenue })),
    recent,
  };
}
