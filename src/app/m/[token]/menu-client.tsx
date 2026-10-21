"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button, cx } from "@/components/ui";
import { RESTAURANT_NAME } from "@/lib/config";
import { formatTL } from "@/lib/money";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  emoji: string;
  isAvailable: boolean;
};
type Category = { id: number; name: string; products: Product[] };

export function MenuClient({
  tableName,
  tableToken,
  menu,
}: {
  tableName: string;
  tableToken: string;
  menu: Category[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const [active, setActive] = useState(menu[0]?.id);

  const cartKey = `sepet:${tableToken}`;
  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(cartKey) ?? "{}"));
      setLastOrder(localStorage.getItem(`son-siparis:${tableToken}`));
    } catch {}
  }, [cartKey, tableToken]);
  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {}
  }, [cart, cartKey]);

  const productById = useMemo(
    () => new Map(menu.flatMap((c) => c.products).map((p) => [p.id, p])),
    [menu],
  );
  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: productById.get(Number(id))!, qty }))
    .filter((l) => l.product && l.qty > 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.product.price, 0);

  const change = (id: number, delta: number) =>
    setCart((c) => {
      const qty = Math.max(0, Math.min(20, (c[id] ?? 0) + delta));
      const next = { ...c, [id]: qty };
      if (!qty) delete next[id];
      return next;
    });

  async function placeOrder() {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableToken,
          note,
          items: lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sipariş gönderilemedi");
      setCart({});
      try {
        localStorage.setItem(`son-siparis:${tableToken}`, data.id);
      } catch {}
      router.push(`/siparis/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sipariş gönderilemedi");
      setSending(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-xl pb-32">
      <header className="bg-gradient-to-br from-brand-600 to-brand-900 px-5 pb-6 pt-8 text-white">
        <p className="text-sm text-brand-100">Hoş geldiniz · {tableName}</p>
        <h1 className="mt-1 text-3xl font-bold">{RESTAURANT_NAME}</h1>
        <p className="mt-2 text-sm text-brand-100">Siparişinizi seçin, mutfağa anında iletilsin.</p>
        {lastOrder && (
          <a
            href={`/siparis/${lastOrder}`}
            className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium hover:bg-white/25"
          >
            Son siparişimi takip et →
          </a>
        )}
      </header>

      <nav className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-stone-200 bg-stone-50/95 px-5 py-3 backdrop-blur">
        {menu.map((c) => (
          <a
            key={c.id}
            href={`#kategori-${c.id}`}
            onClick={() => setActive(c.id)}
            className={cx(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition",
              active === c.id ? "bg-brand-600 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200",
            )}
          >
            {c.name}
          </a>
        ))}
      </nav>

      <main className="space-y-8 px-5 pt-6">
        {menu.map((c) => (
          <section key={c.id} id={`kategori-${c.id}`} className="scroll-mt-16">
            <h2 className="mb-3 text-lg font-bold">{c.name}</h2>
            <ul className="space-y-3">
              {c.products.map((p) => {
                const qty = cart[p.id] ?? 0;
                return (
                  <li
                    key={p.id}
                    className={cx(
                      "flex gap-4 rounded-2xl border bg-white p-4 transition",
                      qty ? "border-brand-500 ring-2 ring-brand-100" : "border-stone-200",
                      !p.isAvailable && "opacity-50",
                    )}
                  >
                    <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-stone-100 text-3xl">
                      {p.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">{p.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-brand-700">{formatTL(p.price)}</span>
                        {!p.isAvailable ? (
                          <span className="text-xs font-medium text-stone-500">Tükendi</span>
                        ) : qty ? (
                          <div className="flex items-center gap-3">
                            <button
                              aria-label={`${p.name} azalt`}
                              onClick={() => change(p.id, -1)}
                              className="grid size-8 place-items-center rounded-full border border-stone-300 font-bold"
                            >
                              −
                            </button>
                            <span className="w-4 text-center font-semibold">{qty}</span>
                            <button
                              aria-label={`${p.name} artır`}
                              onClick={() => change(p.id, 1)}
                              className="grid size-8 place-items-center rounded-full bg-brand-600 font-bold text-white"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => change(p.id, 1)}
                            className="rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                          >
                            Ekle
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      {count > 0 && !open && (
        <div className="fixed inset-x-0 bottom-0 p-4">
          <button
            onClick={() => setOpen(true)}
            className="animate-pop-in mx-auto flex w-full max-w-xl items-center justify-between rounded-2xl bg-brand-600 px-5 py-4 font-semibold text-white shadow-lg"
          >
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-sm">{count}</span>
            <span>Sepeti görüntüle</span>
            <span>{formatTL(total)}</span>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Sepet"
            className="animate-pop-in mx-auto max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Sepetiniz</h2>
              <button onClick={() => setOpen(false)} className="text-sm text-stone-500">
                Kapat
              </button>
            </div>
            {lines.length === 0 ? (
              <p className="py-8 text-center text-stone-500">Sepetiniz boş.</p>
            ) : (
              <>
                <ul className="divide-y divide-stone-100">
                  {lines.map(({ product, qty }) => (
                    <li key={product.id} className="flex items-center gap-3 py-3">
                      <span className="text-2xl">{product.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-stone-500">{formatTL(product.price * qty)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          aria-label={`${product.name} azalt`}
                          onClick={() => change(product.id, -1)}
                          className="grid size-8 place-items-center rounded-full border border-stone-300 font-bold"
                        >
                          −
                        </button>
                        <span className="w-4 text-center font-semibold">{qty}</span>
                        <button
                          aria-label={`${product.name} artır`}
                          onClick={() => change(product.id, 1)}
                          className="grid size-8 place-items-center rounded-full bg-brand-600 font-bold text-white"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <label className="mt-4 block text-sm font-medium" htmlFor="not">
                  Mutfağa not (isteğe bağlı)
                </label>
                <textarea
                  id="not"
                  value={note}
                  maxLength={300}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Örn: Ali Nazik acısız olsun"
                  className="mt-1 w-full rounded-xl border border-stone-300 p-3 text-sm outline-none focus:border-brand-500"
                  rows={2}
                />
                {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <div className="mt-4 flex items-center justify-between text-lg font-bold">
                  <span>Toplam</span>
                  <span>{formatTL(total)}</span>
                </div>
                <Button className="mt-4 w-full py-4 text-base" disabled={sending} onClick={placeOrder}>
                  {sending ? "Gönderiliyor..." : "Siparişi gönder"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
