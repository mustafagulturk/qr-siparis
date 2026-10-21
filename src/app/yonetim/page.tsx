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
          ["Bugünkü ciro", formatTL(d.revenue), "💰", "from-brand-600 to-brand-900"],
          ["Sipariş", String(d.count), "🧾", "from-ember-500 to-ember-600"],
          ["Ortalama sepet", formatTL(d.average), "🛒", "from-amber-400 to-amber-600"],
        ].map(([label, value, icon, grad], i) => (
          <div
            key={label}
            style={{ animationDelay: `${i * 90}ms` }}
            className={`animate-pop-in relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-5 text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl`}
          >
            <div className="pattern-dots absolute inset-0" />
            <span className="absolute -right-3 -top-3 text-7xl opacity-20">{icon}</span>
            <p className="relative text-sm text-white/80">{label}</p>
            <p className="relative mt-1 text-3xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="font-semibold">Son 7 gün ciro</h2>
          <div className="mt-6 flex h-48 items-end gap-3">
            {d.week.map((w) => (
              <div key={w.day.toISOString()} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-xs font-medium text-stone-500 transition group-hover:text-brand-700">
                  {w.revenue ? formatTL(w.revenue).replace(",00", "") : ""}
                </span>
                <div
                  className="animate-grow-up w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-500 transition group-hover:from-ember-600 group-hover:to-ember-500"
                  style={{ height: `${Math.max((w.revenue / max) * 100, 2)}%`, animationDelay: `${d.week.indexOf(w) * 70}ms` }}
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
                <li key={p.name}>
                  <div className="flex items-center gap-3">
                    <span
                      className={cx(
                        "grid size-7 place-items-center rounded-full text-sm font-bold",
                        i === 0 ? "bg-amber-400 text-white" : "bg-brand-50 text-brand-700",
                      )}
                    >
                      {i === 0 ? "🏆" : i + 1}
                    </span>
                    <span className="flex-1 font-medium">{p.name}</span>
                    <span className="text-sm text-stone-500">{p.quantity} adet</span>
                  </div>
                  <div className="ml-10 mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-lime-400"
                      style={{ width: `${(p.quantity / d.topProducts[0].quantity) * 100}%` }}
                    />
                  </div>
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
                <tr key={o.id} className="transition hover:bg-stone-50">
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
