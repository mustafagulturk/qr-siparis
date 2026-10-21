"use client";

import { useEffect, useRef, useState } from "react";
import { Button, cx } from "@/components/ui";
import type { OrderStatus } from "@/db/schema";
import { STATUS_LABEL, nextStatus } from "@/lib/status";
import { useOrderEvents } from "@/lib/use-order-events";

type Order = {
  id: string;
  number: number;
  status: OrderStatus;
  note: string;
  createdAt: string;
  table: { name: string };
  items: { id: number; name: string; quantity: number }[];
};

const COLUMNS: { status: OrderStatus; color: string; action: string }[] = [
  { status: "new", color: "bg-ember-500", action: "Hazırlamaya başla" },
  { status: "preparing", color: "bg-amber-400", action: "Hazır" },
  { status: "ready", color: "bg-brand-500", action: "Teslim edildi" },
];

// Yeni sipariş gelince kısa bir "ding" sesi çalar (ses dosyası gerektirmez)
function ding() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function elapsed(from: string, now: number) {
  const min = Math.floor((now - new Date(from).getTime()) / 60000);
  return min < 1 ? "az önce" : `${min} dk`;
}

export function KitchenBoard({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sound, setSound] = useState(true);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    const res = await fetch("/api/kitchen/orders", { cache: "no-store" });
    if (res.ok) setOrders(await res.json());
  }

  useOrderEvents("/api/events", (e) => {
    refresh();
    if (e?.type === "created") {
      if (soundRef.current) ding();
      setFresh((s) => new Set(s).add(e.orderId));
      setTimeout(() => setFresh((s) => (s.delete(e.orderId), new Set(s))), 4000);
    }
  });

  async function move(order: Order, status: OrderStatus) {
    setBusy(order.id);
    // İyimser güncelleme: ekran anında değişsin, hata olursa geri al
    const before = orders;
    setOrders((os) =>
      status === "served" || status === "cancelled"
        ? os.filter((o) => o.id !== order.id)
        : os.map((o) => (o.id === order.id ? { ...o, status } : o)),
    );
    const res = await fetch(`/api/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setOrders(before);
      alert((await res.json()).error ?? "Güncellenemedi");
    }
    setBusy(null);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mutfak paneli</h1>
          <p className="flex items-center gap-2 text-sm text-stone-500">
            <span className="size-2 animate-pulse rounded-full bg-brand-500" /> Canlı · {orders.length} aktif sipariş
          </p>
        </div>
        <Button variant="secondary" onClick={() => setSound((s) => !s)}>
          {sound ? "🔔 Ses açık" : "🔕 Ses kapalı"}
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = orders
            .filter((o) => o.status === col.status)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          return (
            <section key={col.status} className="rounded-2xl bg-stone-100 p-3">
              <h2 className="mb-3 flex items-center gap-2 px-1 font-semibold">
                <span className={cx("size-3 rounded-full", col.color)} />
                {STATUS_LABEL[col.status]}
                <span className="ml-auto rounded-full bg-white px-2 text-sm">{list.length}</span>
              </h2>
              <div className="space-y-3">
                {list.length === 0 && <p className="py-8 text-center text-sm text-stone-400">Sipariş yok</p>}
                {list.map((o) => {
                  const next = nextStatus(o.status);
                  const late = now - new Date(o.createdAt).getTime() > 20 * 60000;
                  return (
                    <article
                      key={o.id}
                      className={cx(
                        "animate-pop-in rounded-xl bg-white p-4 shadow-sm",
                        fresh.has(o.id) && "animate-flash",
                      )}
                    >
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-lg font-bold">{o.table.name}</h3>
                        <span className={cx("text-sm", late ? "font-semibold text-red-600" : "text-stone-500")}>
                          #{o.number} · {elapsed(o.createdAt, now)}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {o.items.map((i) => (
                          <li key={i.id} className="flex gap-2">
                            <span className="font-bold text-brand-700">{i.quantity}×</span>
                            {i.name}
                          </li>
                        ))}
                      </ul>
                      {o.note && (
                        <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">📝 {o.note}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        {next && (
                          <Button className="flex-1" disabled={busy === o.id} onClick={() => move(o, next)}>
                            {col.action}
                          </Button>
                        )}
                        {o.status !== "ready" && (
                          <Button
                            variant="ghost"
                            disabled={busy === o.id}
                            onClick={() => confirm(`${o.table.name} siparişi iptal edilsin mi?`) && move(o, "cancelled")}
                          >
                            İptal
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
