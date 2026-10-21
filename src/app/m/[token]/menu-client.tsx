"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ServiceButtons } from "@/components/service-buttons";
import { Button, cx } from "@/components/ui";
import { RESTAURANT_NAME } from "@/lib/config";
import { formatTL } from "@/lib/money";
import { TAGS, TAG_KEYS, isTag, type Tag } from "@/lib/tags";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  emoji: string;
  isAvailable: boolean;
  tags: string[];
};
type Category = { id: number; name: string; products: Product[] };

// Türkçe karakterlere duyarsız arama (ç→c, ı→i ...)
const normalize = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");

function Stepper({ name, qty, onChange }: { name: string; qty: number; onChange: (d: number) => void }) {
  return (
    <div className="animate-pop-in flex items-center gap-3">
      <button
        aria-label={`${name} azalt`}
        onClick={() => onChange(-1)}
        className="press grid size-8 place-items-center rounded-full border border-stone-300 bg-white font-bold"
      >
        −
      </button>
      <span key={qty} className="animate-bump w-4 text-center font-semibold">
        {qty}
      </span>
      <button
        aria-label={`${name} artır`}
        onClick={() => onChange(1)}
        className="press grid size-8 place-items-center rounded-full bg-brand-600 font-bold text-white"
      >
        +
      </button>
    </div>
  );
}

export function MenuClient({
  tableName,
  tableToken,
  menu,
  popular,
}: {
  tableName: string;
  tableToken: string;
  menu: Category[];
  popular: number[];
}) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lastOrder, setLastOrder] = useState<string | null>(null);
  const [active, setActive] = useState(menu[0]?.id);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<Tag | null>(null);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const tabs = useRef<HTMLElement>(null);

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

  // Kaydırırken görünen kategorinin sekmesini vurgula
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(Number(visible[0].target.getAttribute("data-id")));
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    document.querySelectorAll("section[data-id]").forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [query]);

  // Aktif sekme görünür alanda kalsın
  useEffect(() => {
    tabs.current?.querySelector(`[data-tab="${active}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const productById = useMemo(() => new Map(menu.flatMap((c) => c.products).map((p) => [p.id, p])), [menu]);
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q && !tagFilter) return menu;
    return menu
      .map((c) => ({
        ...c,
        products: c.products.filter(
          (p) =>
            (!q || normalize(`${p.name} ${p.description}`).includes(q)) && (!tagFilter || p.tags.includes(tagFilter)),
        ),
      }))
      .filter((c) => c.products.length);
  }, [menu, query, tagFilter]);
  const usedTags = useMemo(
    () => TAG_KEYS.filter((t) => menu.some((c) => c.products.some((p) => p.tags.includes(t)))),
    [menu],
  );

  const lines = Object.entries(cart)
    .map(([id, qty]) => ({ product: productById.get(Number(id))!, qty }))
    .filter((l) => l.product && l.qty > 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.product.price, 0);

  const change = (id: number, delta: number) => {
    if (delta > 0 && !cart[id]) {
      setToast({ text: `${productById.get(id)?.emoji} ${productById.get(id)?.name} sepete eklendi`, key: Date.now() });
      navigator.vibrate?.(15);
    }
    setCart((c) => {
      const qty = Math.max(0, Math.min(20, (c[id] ?? 0) + delta));
      const next = { ...c, [id]: qty };
      if (!qty) delete next[id];
      return next;
    });
  };

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
      <header className="relative isolate overflow-hidden bg-brand-900 px-5 pb-8 pt-10 text-white">
        <div className="pattern-dots absolute inset-0 -z-10" />
        <div className="animate-blob absolute -right-16 -top-16 -z-10 size-56 rounded-full bg-brand-500/50 blur-3xl" />
        <div className="animate-blob absolute -bottom-20 -left-10 -z-10 size-48 rounded-full bg-ember-500/30 blur-3xl [animation-delay:-4s]" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
          📍 {tableName}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold">{RESTAURANT_NAME}</h1>
        <p className="mt-1 text-sm text-brand-100">Siparişinizi seçin, mutfağa anında iletilsin.</p>
        <div className="mt-4">
          <ServiceButtons tableToken={tableToken} tone="dark" />
        </div>
        {lastOrder && (
          <a
            href={`/siparis/${lastOrder}`}
            className="press mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-brand-700 shadow-lg"
          >
            <span className="size-2 animate-pulse rounded-full bg-ember-500" /> Son siparişimi takip et
          </a>
        )}
      </header>

      <div className="sticky top-0 z-10 border-b border-stone-200 bg-stone-50/90 backdrop-blur-md">
        <div className="px-5 pt-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Menüde ara (örn: kebap, kahve)"
              aria-label="Menüde ara"
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>
        {usedTags.length > 0 && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-3">
            {usedTags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter((f) => (f === t ? null : t))}
                aria-pressed={tagFilter === t}
                className={cx(
                  "press whitespace-nowrap rounded-lg px-3 py-1 text-xs font-semibold transition",
                  tagFilter === t ? "bg-stone-900 text-white" : TAGS[t].className,
                )}
              >
                {TAGS[t].icon} {TAGS[t].label}
              </button>
            ))}
          </div>
        )}
        <nav ref={tabs} className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3">
          {filtered.map((c) => (
            <a
              key={c.id}
              data-tab={c.id}
              href={`#kategori-${c.id}`}
              className={cx(
                "press whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-300",
                active === c.id
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/30"
                  : "bg-white text-stone-700 ring-1 ring-stone-200",
              )}
            >
              {c.name}
            </a>
          ))}
        </nav>
      </div>

      <main className="space-y-8 px-5 pt-6">
        {filtered.length === 0 && (
          <div className="py-16 text-center text-stone-500">
            <div className="text-4xl">🤷</div>
            <p className="mt-2">Aramanıza uygun ürün bulunamadı.</p>
            <button
              onClick={() => {
                setQuery("");
                setTagFilter(null);
              }}
              className="mt-3 text-sm font-semibold text-brand-700"
            >
              Filtreleri temizle
            </button>
          </div>
        )}
        {filtered.map((c) => (
          <section key={c.id} id={`kategori-${c.id}`} data-id={c.id} className="scroll-mt-32">
            <h2 className="mb-3 text-lg font-bold">{c.name}</h2>
            <ul className="space-y-3">
              {c.products.map((p, i) => {
                const qty = cart[p.id] ?? 0;
                const isPopular = popular.includes(p.id);
                return (
                  <li
                    key={p.id}
                    style={{ animationDelay: `${i * 50}ms` }}
                    className={cx(
                      "animate-pop-in relative flex gap-4 rounded-2xl border bg-white p-4 transition-all duration-300",
                      qty ? "border-brand-500 shadow-md shadow-brand-600/10 ring-2 ring-brand-100" : "border-stone-200 hover:shadow-md",
                      !p.isAvailable && "opacity-50 grayscale",
                    )}
                  >
                    {isPopular && p.isAvailable && (
                      <span className="absolute -top-2 right-4 rounded-full bg-gradient-to-r from-ember-500 to-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-white shadow">
                        🔥 Popüler
                      </span>
                    )}
                    <div
                      className={cx(
                        "grid size-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-stone-100 to-stone-200 text-3xl transition-transform duration-300",
                        qty > 0 && "scale-105 rotate-3",
                      )}
                    >
                      {p.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">{p.description}</p>
                      {p.tags.some(isTag) && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.tags.filter(isTag).map((t) => (
                            <span key={t} className={cx("rounded-md px-1.5 py-0.5 text-[11px] font-semibold", TAGS[t].className)}>
                              {TAGS[t].icon} {TAGS[t].label}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-brand-700">{formatTL(p.price)}</span>
                        {!p.isAvailable ? (
                          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                            Tükendi
                          </span>
                        ) : qty ? (
                          <Stepper name={p.name} qty={qty} onChange={(d) => change(p.id, d)} />
                        ) : (
                          <button
                            onClick={() => change(p.id, 1)}
                            className="press rounded-full bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-600 hover:text-white"
                          >
                            + Ekle
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

      {toast && (
        <div
          key={toast.key}
          role="status"
          className="animate-pop-in fixed inset-x-0 top-4 z-30 mx-auto w-fit rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-xl"
        >
          {toast.text}
        </div>
      )}

      {count > 0 && !open && (
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-stone-50 via-stone-50/80 p-4">
          <button
            onClick={() => setOpen(true)}
            className="press animate-pop-in mx-auto flex w-full max-w-xl items-center justify-between rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-4 font-semibold text-white shadow-xl shadow-brand-900/30"
          >
            <span key={count} className="animate-bump rounded-full bg-white/20 px-2.5 py-0.5 text-sm">
              {count}
            </span>
            <span>Sepeti görüntüle</span>
            <span>{formatTL(total)}</span>
          </button>
        </div>
      )}

      {open && (
        <div className="animate-pop-in fixed inset-0 z-20 flex items-end bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-label="Sepet"
            className="mx-auto max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-200" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Sepetiniz</h2>
              <button onClick={() => setOpen(false)} className="rounded-full px-3 py-1 text-sm text-stone-500 hover:bg-stone-100">
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
                      <span className="grid size-11 place-items-center rounded-xl bg-stone-100 text-2xl">{product.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-stone-500">{formatTL(product.price * qty)}</p>
                      </div>
                      <Stepper name={product.name} qty={qty} onChange={(d) => change(product.id, d)} />
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
                  className="mt-1 w-full rounded-xl border border-stone-300 p-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  rows={2}
                />
                {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <div className="mt-4 space-y-1 rounded-xl bg-stone-50 p-4 text-sm">
                  <div className="flex justify-between text-stone-500">
                    <span>{count} ürün</span>
                    <span>{formatTL(total)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Toplam</span>
                    <span>{formatTL(total)}</span>
                  </div>
                </div>
                <Button className="press mt-4 w-full py-4 text-base shadow-lg shadow-brand-600/30" disabled={sending} onClick={placeOrder}>
                  {sending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Gönderiliyor...
                    </>
                  ) : (
                    "Siparişi gönder →"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
