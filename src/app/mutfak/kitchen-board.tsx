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

const COLUMNS: { status: OrderStatus; color: string; icon: string; action: string }[] = [
  { status: "new", color: "bg-ember-500", icon: "📝", action: "Hazırlamaya başla" },
  { status: "preparing", color: "bg-amber-400", icon: "🔥", action: "Hazır" },
  { status: "ready", color: "bg-brand-500", icon: "🔔", action: "Teslim edildi" },
];

const LATE_MIN = 20;

type ServiceRequest = {
  id: number;
  type: "waiter" | "bill";
  createdAt: string;
  table: { name: string };
};

// Yeni sipariş gelince kısa bir "ding" sesi çalar (ses dosyası gerektirmez).
// Garson çağrısında farklı, daha pes bir ton kullanılır.
function ding(tones = [880, 1320]) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain).connect(ctx.destination);
    osc.frequency.setValueAtTime(tones[0], ctx.currentTime);
    osc.frequency.setValueAtTime(tones[1], ctx.currentTime + 0.12);
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

export function KitchenBoard({ initial, initialRequests }: { initial: Order[]; initialRequests: ServiceRequest[] }) {
  const [orders, setOrders] = useState(initial);
  const [requests, setRequests] = useState(initialRequests);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [sound, setSound] = useState(true);
  const [dark, setDark] = useState(false);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  // Mutfak ekranları genelde loş ortamda durur; karanlık tema tercihi hatırlanır
  useEffect(() => {
    try {
      setDark(localStorage.getItem("mutfak-tema") === "koyu");
    } catch {}
  }, []);
  const toggleDark = () =>
    setDark((d) => {
      try {
        localStorage.setItem("mutfak-tema", d ? "acik" : "koyu");
      } catch {}
      return !d;
    });
  const toggleFullscreen = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    const res = await fetch("/api/kitchen/orders", { cache: "no-store" });
    if (res.ok) setOrders(await res.json());
  }

  async function refreshRequests() {
    const res = await fetch("/api/kitchen/requests", { cache: "no-store" });
    if (res.ok) setRequests(await res.json());
  }

  async function resolveRequest(id: number) {
    setRequests((rs) => rs.filter((r) => r.id !== id));
    await fetch(`/api/kitchen/requests/${id}`, { method: "PATCH" });
  }

  useOrderEvents("/api/events", (e) => {
    if (!e || e.type === "service") {
      refreshRequests();
      if (e?.type === "service" && !e.resolved && soundRef.current) ding([520, 390]);
      if (e) return;
    }
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
    <main className={cx("min-h-[calc(100dvh-57px)] transition-colors duration-500", dark ? "bg-stone-950 text-stone-100" : "")}>
      <div className="mx-auto max-w-7xl px-5 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mutfak paneli</h1>
          <p className={cx("flex items-center gap-2 text-sm", dark ? "text-stone-400" : "text-stone-500")}>
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-500 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-brand-500" />
            </span>
            Canlı · {orders.length} aktif sipariş
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setSound((s) => !s)} className={cx(dark && "border-stone-700! bg-stone-900! text-stone-100! hover:bg-stone-800!")}>
            {sound ? "🔔 Ses açık" : "🔕 Ses kapalı"}
          </Button>
          <Button variant="secondary" onClick={toggleDark} className={cx(dark && "border-stone-700! bg-stone-900! text-stone-100! hover:bg-stone-800!")}>
            {dark ? "☀️ Açık" : "🌙 Koyu"}
          </Button>
          <Button variant="secondary" onClick={toggleFullscreen} className={cx(dark && "border-stone-700! bg-stone-900! text-stone-100! hover:bg-stone-800!")}>
            ⛶ Tam ekran
          </Button>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-3" aria-live="assertive">
          {requests.map((r) => (
            <div
              key={r.id}
              className={cx(
                "animate-slide-in flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-white shadow-lg",
                r.type === "bill" ? "bg-violet-600" : "bg-sky-600",
              )}
            >
              <span className="animate-wiggle text-2xl">{r.type === "bill" ? "🧾" : "🙋"}</span>
              <span>
                {r.table.name}: {r.type === "bill" ? "hesap istiyor" : "garson çağırıyor"}
                <span className="ml-2 text-sm font-normal text-white/75">{elapsed(r.createdAt, now)}</span>
              </span>
              <button
                onClick={() => resolveRequest(r.id)}
                className="press ml-2 rounded-lg bg-white/20 px-3 py-1 text-sm hover:bg-white/30"
              >
                Tamam
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const list = orders
            .filter((o) => o.status === col.status)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
          return (
            <section key={col.status} className={cx("rounded-2xl p-3 transition-colors", dark ? "bg-stone-900" : "bg-stone-100")}>
              <div className={cx("mb-3 h-1 rounded-full", col.color)} />
              <h2 className="mb-3 flex items-center gap-2 px-1 font-semibold">
                <span>{col.icon}</span>
                {STATUS_LABEL[col.status]}
                <span
                  key={list.length}
                  className={cx("animate-bump ml-auto rounded-full px-2.5 text-sm font-bold text-white", col.color)}
                >
                  {list.length}
                </span>
              </h2>
              <div className="space-y-3">
                {list.length === 0 && (
                  <div className={cx("rounded-xl border-2 border-dashed py-10 text-center text-sm", dark ? "border-stone-800 text-stone-600" : "border-stone-200 text-stone-400")}>
                    Sipariş yok
                  </div>
                )}
                {list.map((o) => {
                  const next = nextStatus(o.status);
                  const minutes = (now - new Date(o.createdAt).getTime()) / 60000;
                  const late = minutes > LATE_MIN;
                  const ratio = Math.min(minutes / LATE_MIN, 1);
                  return (
                    <article
                      key={o.id}
                      className={cx(
                        "animate-slide-in relative overflow-hidden rounded-xl p-4 shadow-sm transition hover:shadow-md",
                        dark ? "bg-stone-800" : "bg-white",
                        fresh.has(o.id) && "animate-flash",
                        late && "ring-2 ring-red-500/60",
                      )}
                    >
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-lg font-bold">{o.table.name}</h3>
                        <span className={cx("text-sm", late ? "font-semibold text-red-500" : dark ? "text-stone-400" : "text-stone-500")}>
                          {late && "⚠️ "}#{o.number} · {elapsed(o.createdAt, now)}
                        </span>
                      </div>
                      {o.status !== "ready" && (
                        <div className={cx("mt-2 h-1 overflow-hidden rounded-full", dark ? "bg-stone-700" : "bg-stone-100")}>
                          <div
                            className={cx(
                              "h-full rounded-full transition-all duration-1000",
                              ratio < 0.5 ? "bg-brand-500" : ratio < 1 ? "bg-amber-400" : "bg-red-500",
                            )}
                            style={{ width: `${Math.max(ratio * 100, 4)}%` }}
                          />
                        </div>
                      )}
                      <ul className="mt-2 space-y-1">
                        {o.items.map((i) => (
                          <li key={i.id} className="flex items-center gap-2">
                            <span className={cx("grid min-w-7 place-items-center rounded-md px-1 text-sm font-bold", dark ? "bg-brand-900 text-lime-300" : "bg-brand-50 text-brand-700")}>{i.quantity}×</span>
                            {i.name}
                          </li>
                        ))}
                      </ul>
                      {o.note && (
                        <p className={cx("mt-2 rounded-lg p-2 text-sm", dark ? "bg-amber-900/40 text-amber-200" : "bg-amber-50 text-amber-900")}>📝 {o.note}</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        {next && (
                          <Button className="press flex-1" disabled={busy === o.id} onClick={() => move(o, next)}>
                            {col.action}
                          </Button>
                        )}
                        {o.status !== "ready" && (
                          <Button
                            variant="ghost"
                            className={cx(dark && "text-stone-400 hover:bg-stone-700")}
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
      </div>
    </main>
  );
}
