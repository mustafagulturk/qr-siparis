import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { orderItems, products, tables } from "@/db/schema";
import { orderBus, type OrderEvent } from "@/lib/events";
import { createOrder, getActiveOrders, OrderError, updateOrderStatus } from "@/lib/orders";
import { db, resetDb, seedBasic } from "./helpers";

let s: Awaited<ReturnType<typeof seedBasic>>;

beforeEach(async () => {
  await resetDb();
  s = await seedBasic();
});
afterAll(() => db.$client.end());

const order = (items: { productId: number; quantity: number }[], note = "") =>
  createOrder(db, { tableToken: "test-masa", note, items });

describe("sipariş oluşturma", () => {
  it("toplamı veritabanındaki fiyatlardan hesaplar", async () => {
    const o = await order([
      { productId: s.kebap.id, quantity: 2 },
      { productId: s.ayran.id, quantity: 1 },
    ]);
    expect(o.total).toBe(2 * 42000 + 4000);
    expect(o.status).toBe("new");
  });

  it("aynı ürün iki kez gelirse tek satırda birleştirir", async () => {
    const o = await order([
      { productId: s.ayran.id, quantity: 1 },
      { productId: s.ayran.id, quantity: 2 },
    ]);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("ürün fiyatı sonradan değişse de siparişteki fiyat korunur", async () => {
    const o = await order([{ productId: s.kebap.id, quantity: 1 }]);
    await db.update(products).set({ price: 99900 }).where(eq(products.id, s.kebap.id));
    const [item] = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
    expect(item.unitPrice).toBe(42000);
  });

  it("tükenen ürün sipariş edilemez", async () => {
    await db.update(products).set({ isAvailable: false }).where(eq(products.id, s.kebap.id));
    await expect(order([{ productId: s.kebap.id, quantity: 1 }])).rejects.toThrow("servis edilemiyor");
  });

  it("menüde olmayan ürün reddedilir", async () => {
    await expect(order([{ productId: 9999, quantity: 1 }])).rejects.toBeInstanceOf(OrderError);
  });

  it("geçersiz veya pasif masa anahtarı reddedilir", async () => {
    await expect(
      createOrder(db, { tableToken: "yok", note: "", items: [{ productId: s.ayran.id, quantity: 1 }] }),
    ).rejects.toThrow("Masa bulunamadı");
    await db.update(tables).set({ isActive: false }).where(eq(tables.id, s.table.id));
    await expect(order([{ productId: s.ayran.id, quantity: 1 }])).rejects.toThrow("Masa bulunamadı");
  });

  it("yeni sipariş olayı yayınlar", async () => {
    const listener = vi.fn();
    orderBus.on("order", listener);
    const o = await order([{ productId: s.ayran.id, quantity: 1 }]);
    orderBus.off("order", listener);
    expect(listener).toHaveBeenCalledWith<[OrderEvent]>({ type: "created", orderId: o.id, status: "new" });
  });
});

describe("sipariş durumu", () => {
  it("doğru sırayla ilerler ve teslim edilince aktif listeden çıkar", async () => {
    const o = await order([{ productId: s.ayran.id, quantity: 1 }]);
    await updateOrderStatus(db, o.id, "preparing");
    await updateOrderStatus(db, o.id, "ready");
    expect(await getActiveOrders(db)).toHaveLength(1);
    await updateOrderStatus(db, o.id, "served");
    expect(await getActiveOrders(db)).toHaveLength(0);
  });

  it("adım atlanamaz ve teslim edilen sipariş geri alınamaz", async () => {
    const o = await order([{ productId: s.ayran.id, quantity: 1 }]);
    await expect(updateOrderStatus(db, o.id, "served")).rejects.toMatchObject({ status: 409 });
    await updateOrderStatus(db, o.id, "preparing");
    await updateOrderStatus(db, o.id, "ready");
    await updateOrderStatus(db, o.id, "served");
    await expect(updateOrderStatus(db, o.id, "cancelled")).rejects.toMatchObject({ status: 409 });
  });

  it("aynı anda iki güncellemeden yalnızca biri başarılı olur", async () => {
    const o = await order([{ productId: s.ayran.id, quantity: 1 }]);
    const results = await Promise.allSettled([
      updateOrderStatus(db, o.id, "preparing"),
      updateOrderStatus(db, o.id, "preparing"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
});
