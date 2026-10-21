"use client";

import { useEffect, useState } from "react";
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

const CONFETTI_COLORS = ["#528024", "#e8742a", "#fbbf24", "#6a9f2f", "#f97316", "#84cc16"];

// Sipariş hazır olunca ekrana dökülen konfeti (kütüphane gerektirmez)
function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.6,
      size: 6 + Math.random() * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.random() * 360,
      round: Math.random() > 0.5,
    })),
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.4,
            background: p.color,
            borderRadius: p.round ? "50%" : 2,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            rotate: `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}

// Basit tahmin: hazırlık için 10 dk + ürün başına 2 dk, geçen süre düşülür
function estimateMinutes(order: Order, now: number) {
  const items = order.items.reduce((s, i) => s + i.quantity, 0);
  const passed = (now - new Date(order.createdAt).getTime()) / 60000;
  return Math.max(1, Math.round(10 + items * 2 - passed));
}

export function OrderTracker({ initial }: { initial: Order }) {
  const [order, setOrder] = useState(initial);
  const [pulse, setPulse] = useState(false);
  const [party, setParty] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (order.status !== "ready") return;
    setParty(true);
    const t = setTimeout(() => setParty(false), 4500);
    return () => clearTimeout(t);
  }, [order.status]);

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

      {party && <Confetti />}
      <div
        className={cx(
          "relative mt-6 overflow-hidden rounded-3xl p-6 text-center text-white shadow-xl transition-colors duration-700",
          cancelled ? "bg-red-600 shadow-red-900/20" : "bg-brand-900 shadow-brand-900/30",
          pulse && "animate-flash",
        )}
        aria-live="polite"
      >
        {!cancelled && (
          <>
            <div className="pattern-dots absolute inset-0" />
            <div className="animate-blob absolute -right-10 -top-10 size-40 rounded-full bg-brand-500/50 blur-2xl" />
            <div className="animate-blob absolute -bottom-12 -left-8 size-36 rounded-full bg-ember-500/30 blur-2xl [animation-delay:-3s]" />
          </>
        )}
        <div className="relative">
          <div
            key={order.status}
            className={cx(
              "animate-pop-in mx-auto grid size-20 place-items-center rounded-full bg-white/15 text-5xl",
              !cancelled && order.status !== "served" && "animate-ring",
            )}
          >
            <span className={cx(order.status === "ready" && "animate-wiggle")}>{cancelled ? "❌" : STEPS[current]?.icon}</span>
          </div>
          <p key={`t-${order.status}`} className="animate-pop-in mt-4 text-2xl font-bold">
            {STATUS_LABEL[order.status]}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {cancelled ? "Siparişiniz iptal edildi. Lütfen garsonla görüşün." : STEPS[current]?.text}
          </p>
          {(order.status === "new" || order.status === "preparing") && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur">
              ⏱️ Tahmini {estimateMinutes(order, now)} dk
            </p>
          )}
          {!cancelled && (
            <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime-300 to-amber-300 transition-all duration-1000 ease-out"
                style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {!cancelled && (
        <ol className="mt-8 space-y-0">
          {STEPS.map((s, i) => (
            <li key={s.status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cx(
                    "grid size-8 place-items-center rounded-full text-sm font-bold transition-all duration-500",
                    i === current && "scale-110 ring-4 ring-brand-100",
                    i <= current ? "bg-brand-600 text-white" : "bg-stone-200 text-stone-500",
                  )}
                >
                  {i < current ? "✓" : i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="relative h-8 w-0.5 bg-stone-200"><span className={cx("absolute inset-x-0 top-0 bg-brand-600 transition-all duration-700", i < current ? "h-full" : "h-0")} /></span>
                )}
              </div>
              <p className={cx("pt-1 font-medium", i <= current ? "text-stone-900" : "text-stone-400")}>
                {STATUS_LABEL[s.status]}
              </p>
            </li>
          ))}
        </ol>
      )}

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
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
