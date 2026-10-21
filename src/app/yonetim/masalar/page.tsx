import { asc } from "drizzle-orm";
import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { Card, cx } from "@/components/ui";
import { db } from "@/db";
import { tables } from "@/db/schema";
import { RESTAURANT_NAME } from "@/lib/config";
import { AddTableForm, PrintButton, TableActions } from "./table-controls";

export const metadata: Metadata = { title: "Masalar ve QR kodlar" };
export const dynamic = "force-dynamic";

async function baseUrl() {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export default async function TablesPage() {
  const list = await db.query.tables.findMany({ orderBy: [asc(tables.id)] });
  const base = await baseUrl();
  const withQr = await Promise.all(
    list.map(async (t) => {
      const url = `${base}/m/${t.token}`;
      return { ...t, url, qr: await QRCode.toDataURL(url, { width: 360, margin: 1, color: { dark: "#26391a" } }) };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold">Masalar ve QR kodlar</h1>
        <div className="flex gap-2">
          <AddTableForm />
          <PrintButton />
        </div>
      </div>
      <p className="text-sm text-stone-500 print:hidden">
        QR kodları yazdırıp masalara yapıştırın. Bir QR kodun fotoğrafı dışarı paylaşıldıysa &quot;Yeni QR&quot; ile
        eskisini geçersiz kılabilirsiniz.
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2">
        {withQr.map((t) => (
          <Card key={t.id} className={cx("text-center break-inside-avoid", !t.isActive && "opacity-50 print:hidden")}>
            <p className="text-sm text-stone-500">{RESTAURANT_NAME}</p>
            <h2 className="text-xl font-bold">{t.name}</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.qr} alt={`${t.name} QR kodu`} className="mx-auto my-3 size-48" />
            <p className="text-sm font-medium">Menü ve sipariş için okutun</p>
            <a href={t.url} target="_blank" className="mt-1 block truncate text-xs text-brand-700 hover:underline print:hidden">
              {t.url}
            </a>
            <TableActions id={t.id} isActive={t.isActive} />
          </Card>
        ))}
      </div>
    </div>
  );
}
