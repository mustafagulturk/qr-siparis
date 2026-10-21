import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { orderBus } from "@/lib/events";
import { createOrder, updateOrderStatus } from "@/lib/orders";
import { createReview, createServiceRequest, getOpenServiceRequests, resolveServiceRequest } from "@/lib/service";
import { db, resetDb, seedBasic } from "./helpers";

let s: Awaited<ReturnType<typeof seedBasic>>;

beforeEach(async () => {
  await resetDb();
  s = await seedBasic();
});
afterAll(() => db.$client.end());

describe("garson çağırma", () => {
  it("aynı masa butona tekrar basarsa yeni çağrı açılmaz", async () => {
    const first = await createServiceRequest(db, { tableToken: "test-masa", type: "waiter" });
    const second = await createServiceRequest(db, { tableToken: "test-masa", type: "waiter" });
    expect(second.duplicate).toBe(true);
    expect(second.request.id).toBe(first.request.id);
    // Farklı türdeki istek ayrı açılır
    await createServiceRequest(db, { tableToken: "test-masa", type: "bill" });
    expect(await getOpenServiceRequests(db)).toHaveLength(2);
  });

  it("kapatılan çağrıdan sonra yeniden çağrılabilir ve olay yayınlanır", async () => {
    const listener = vi.fn();
    orderBus.on("service", listener);
    const { request } = await createServiceRequest(db, { tableToken: "test-masa", type: "bill" });
    await resolveServiceRequest(db, request.id);
    orderBus.off("service", listener);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0]).toMatchObject({ resolved: true, service: "bill", tableName: "Masa 1" });
    expect(await getOpenServiceRequests(db)).toHaveLength(0);
    await expect(resolveServiceRequest(db, request.id)).rejects.toMatchObject({ status: 404 });
    const again = await createServiceRequest(db, { tableToken: "test-masa", type: "bill" });
    expect(again.duplicate).toBe(false);
  });

  it("geçersiz masadan çağrı yapılamaz", async () => {
    await expect(createServiceRequest(db, { tableToken: "yok", type: "waiter" })).rejects.toThrow("Masa bulunamadı");
  });
});

describe("değerlendirme", () => {
  const newOrder = () =>
    createOrder(db, { tableToken: "test-masa", note: "", items: [{ productId: s.ayran.id, quantity: 1 }] });

  it("sipariş hazır olmadan değerlendirilemez", async () => {
    const o = await newOrder();
    await expect(createReview(db, o.id, { rating: 5, comment: "" })).rejects.toThrow("hazır olmadan");
  });

  it("her sipariş yalnızca bir kez değerlendirilebilir", async () => {
    const o = await newOrder();
    await updateOrderStatus(db, o.id, "preparing");
    await updateOrderStatus(db, o.id, "ready");
    const review = await createReview(db, o.id, { rating: 4, comment: "Lezzetliydi" });
    expect(review.rating).toBe(4);
    await expect(createReview(db, o.id, { rating: 1, comment: "" })).rejects.toMatchObject({ status: 409 });
  });
});
