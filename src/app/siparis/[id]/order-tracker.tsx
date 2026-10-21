"use client";

import { useState } from "react";
import { cx } from "@/components/ui";
import type { OrderStatus } from "@/db/schema";
import { formatTL } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/status";
import { useOrderEvents } from "@/lib/use-order-events";

type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  note: string;
  total: number;
  createdAt: string;
  table: { name: string };
  items: { id: number; name: string; unitPrice: number; quantity: number }[];
};

const STEPS: { status: OrderStatus; icon: string; text: string }[] = [
  { status: "new", icon: "📝", text: "Siparişiniz mutfağa iletildi" },
  { status: "preparing", icon: "👨‍🍳", text: "Şefimiz siparişinizi hazırlıyor" },
  { status: "ready", icon: "🔔", text: "Siparişiniz hazır, birazdan masanızda" },
  { status: "served", icon: "😋", text: "Afiyet olsun!" },
];

export function OrderTracker({ initial }: { initial: Order }) {
  const [order, setOrder] = useState(initial);
  const [pulse, setPulse] = useState(false);

  useOrderEvents(`/api/events?order=${order.id}`, async (e) => {
    if (e) {
      setOrder((o) => ({ ...o, status: e.status }));
      setPulse(true);
      navigator.vibrate?.(200);
      setTimeout(() => setPulse(false), 3000);
    } else {
      const res = await fetch(`/api/orders/${order.id}`);
      if (res.ok) setOrder(await res.json());
    }
  });

  const current = STEPS.findIndex((s) => s.status === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-8">
      <p className="text-sm text-stone-500">{order.table.name}</p>
      <h1 className="text-2xl font-bold">Sipariş #{order.number}</h1>

      <div
        className={cx(
          "mt-6 rounded-3xl p-6 text-center text-white transition-colors",
          cancelled ? "bg-red-600" : "bg-gradient-to-br from-brand-600 to-brand-900",
          pulse && "animate-flash",
        )}
        aria-live="polite"
      >
        <div className="text-5xl">{cancelled ? "❌" : STEPS[current]?.icon}</div>
        <p className="mt-3 text-xl font-bold">{STATUS_LABEL[order.status]}</p>
        <p className="mt-1 text-sm text-white/80">
          {cancelled ? "Siparişiniz iptal edildi. Lütfen garsonla görüşün." : STEPS[current]?.text}
        </p>
      </div>

      {!cancelled && (
        <ol className="mt-8 space-y-0">
          {STEPS.map((s, i) => (
            <li key={s.status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cx(
                    "grid size-8 place-items-center rounded-full text-sm font-bold transition-colors",
                    i <= current ? "bg-brand-600 text-white" : "bg-stone-200 text-stone-500",
                  )}
                >
                  {i < current ? "✓" : i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span className={cx("h-8 w-0.5", i < current ? "bg-brand-600" : "bg-stone-200")} />
                )}
              </div>
              <p className={cx("pt-1 font-medium", i <= current ? "text-stone-900" : "text-stone-400")}>
                {STATUS_LABEL[s.status]}
              </p>
            </li>
          ))}
        </ol>
      )}

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="font-semibold">Sipariş detayı</h2>
        <ul className="mt-3 divide-y divide-stone-100 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-2">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span>{formatTL(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        {order.note && <p className="mt-3 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">Not: {order.note}</p>}
        <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 font-bold">
          <span>Toplam</span>
          <span>{formatTL(order.total)}</span>
        </div>
      </section>
      <p className="mt-6 text-center text-xs text-stone-400">Bu sayfa otomatik olarak güncellenir.</p>
    </main>
  );
}
