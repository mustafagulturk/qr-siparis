import type { Metadata } from "next";
import { Card, cx } from "@/components/ui";
import { db } from "@/db";
import { formatTL } from "@/lib/money";
import { getDashboard } from "@/lib/reports";
import { STATUS_LABEL } from "@/lib/status";

export const metadata: Metadata = { title: "Yönetim" };
export const dynamic = "force-dynamic";

const STATUS_COLOR = {
  new: "bg-orange-100 text-orange-800",
  preparing: "bg-amber-100 text-amber-800",
  ready: "bg-brand-100 text-brand-700",
  served: "bg-stone-100 text-stone-700",
  cancelled: "bg-red-100 text-red-700",
} as const;

export default async function DashboardPage() {
  const d = await getDashboard(db);
  const max = Math.max(...d.week.map((w) => w.revenue), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bugünün özeti</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Ciro", formatTL(d.revenue), "💰"],
          ["Sipariş", String(d.count), "🧾"],
          ["Ortalama sepet", formatTL(d.average), "🛒"],
        ].map(([label, value, icon]) => (
          <Card key={label}>
            <p className="text-sm text-stone-500">
              {icon} {label}
            </p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="font-semibold">Son 7 gün ciro</h2>
          <div className="mt-6 flex h-48 items-end gap-3">
            {d.week.map((w) => (
              <div key={w.day.toISOString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs text-stone-500">{w.revenue ? formatTL(w.revenue).replace(",00", "") : ""}</span>
                <div
                  className="w-full rounded-t-lg bg-brand-500 transition-all"
                  style={{ height: `${Math.max((w.revenue / max) * 100, 2)}%` }}
                  title={formatTL(w.revenue)}
                />
                <span className="text-xs text-stone-500">
                  {w.day.toLocaleDateString("tr-TR", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-semibold">En çok satanlar (7 gün)</h2>
          {d.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">Henüz satış yok.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {d.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{p.name}</span>
                  <span className="text-sm text-stone-500">{p.quantity} adet</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold">Son siparişler</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-stone-500">
              <tr>
                <th className="py-2 font-medium">No</th>
                <th className="py-2 font-medium">Masa</th>
                <th className="py-2 font-medium">Saat</th>
                <th className="py-2 font-medium">Durum</th>
                <th className="py-2 text-right font-medium">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {d.recent.map((o) => (
                <tr key={o.id}>
                  <td className="py-2">#{o.number}</td>
                  <td className="py-2">{o.table.name}</td>
                  <td className="py-2">
                    {o.createdAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: process.env.APP_TIMEZONE ?? "Europe/Istanbul" })}
                  </td>
                  <td className="py-2">
                    <span className={cx("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLOR[o.status])}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="py-2 text-right font-medium">{formatTL(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {d.recent.length === 0 && <p className="py-4 text-sm text-stone-500">Henüz sipariş yok.</p>}
        </div>
      </Card>
    </div>
  );
}
