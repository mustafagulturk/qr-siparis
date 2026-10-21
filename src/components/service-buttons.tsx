"use client";

import { useState } from "react";
import { cx } from "./ui";

type Kind = "waiter" | "bill";

const LABELS: Record<Kind, { icon: string; idle: string; done: string }> = {
  waiter: { icon: "🙋", idle: "Garson çağır", done: "Garson geliyor" },
  bill: { icon: "🧾", idle: "Hesap iste", done: "Hesap isteğiniz iletildi" },
};

/** Müşterinin garson çağırması veya hesap istemesi için butonlar. */
export function ServiceButtons({ tableToken, tone = "light" }: { tableToken: string; tone?: "light" | "dark" }) {
  const [sent, setSent] = useState<Partial<Record<Kind, boolean>>>({});
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState("");

  async function call(type: Kind) {
    setBusy(type);
    setError("");
    try {
      const res = await fetch("/api/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableToken, type }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "İstek gönderilemedi");
      setSent((s) => ({ ...s, [type]: true }));
      navigator.vibrate?.(30);
      // Bir dakika sonra tekrar çağırabilsin
      setTimeout(() => setSent((s) => ({ ...s, [type]: false })), 60000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İstek gönderilemedi");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(LABELS) as Kind[]).map((k) => (
          <button
            key={k}
            disabled={busy === k || sent[k]}
            onClick={() => call(k)}
            className={cx(
              "press inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition",
              sent[k]
                ? "bg-lime-300 text-brand-900"
                : tone === "dark"
                  ? "bg-white/15 text-white backdrop-blur hover:bg-white/25"
                  : "border border-stone-200 bg-white text-stone-700 hover:border-brand-500",
            )}
          >
            <span className={cx(sent[k] && "animate-wiggle")}>{sent[k] ? "✓" : LABELS[k].icon}</span>
            {sent[k] ? LABELS[k].done : busy === k ? "Gönderiliyor..." : LABELS[k].idle}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  );
}
