import { getSession } from "@/lib/auth";
import { orderBus, type OrderEvent, type ServiceEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events akışı.
 * ?order=<id> ile müşteri yalnızca kendi siparişini dinler; parametresiz
 * istek tüm siparişleri ve garson çağrılarını döner, sadece personele açıktır.
 */
export async function GET(req: Request) {
  const orderId = new URL(req.url).searchParams.get("order");
  if (!orderId && !(await getSession())) return new Response("Yetkisiz", { status: 401 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(data));
      const onEvent = (e: OrderEvent) => {
        if (!orderId || e.orderId === orderId) send(`data: ${JSON.stringify(e)}\n\n`);
      };
      const onService = (e: ServiceEvent) => {
        if (!orderId) send(`data: ${JSON.stringify(e)}\n\n`);
      };
      // Proxy'ler bağlantıyı kapatmasın diye düzenli yorum satırı gönder
      const ping = setInterval(() => send(": ping\n\n"), 25_000);

      orderBus.on("order", onEvent);
      orderBus.on("service", onService);
      send("retry: 3000\n\n");
      cleanup = () => {
        clearInterval(ping);
        orderBus.off("order", onEvent);
        orderBus.off("service", onService);
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
