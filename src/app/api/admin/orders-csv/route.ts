import { and, desc, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { STATUS_LABEL } from "@/lib/status";

export const dynamic = "force-dynamic";

// Excel'in Türkçe karakterleri doğru açması için BOM ve ";" ayırıcı kullanılır
const cell = (v: string | number) => {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const session = await getSession();
  if (session?.role !== "admin") return new Response("Yetkisiz", { status: 403 });

  const days = Math.min(Math.max(Number(new URL(req.url).searchParams.get("gun")) || 30, 1), 365);
  const rows = await db.query.orders.findMany({
    where: and(gte(orders.createdAt, sql`now() - make_interval(days => ${days})`)),
    orderBy: [desc(orders.createdAt)],
    with: { items: true, table: { columns: { name: true } }, review: true },
  });

  const tz = process.env.APP_TIMEZONE ?? "Europe/Istanbul";
  const header = ["Sipariş No", "Tarih", "Masa", "Durum", "Ürünler", "Not", "Tutar (TL)", "Puan"];
  const lines = rows.map((o) =>
    [
      o.number,
      o.createdAt.toLocaleString("tr-TR", { timeZone: tz }),
      o.table.name,
      STATUS_LABEL[o.status],
      o.items.map((i) => `${i.quantity}x ${i.name}`).join(", "),
      o.note,
      (o.total / 100).toFixed(2).replace(".", ","),
      o.review?.rating ?? "",
    ]
      .map(cell)
      .join(";"),
  );

  const date = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + [header.join(";"), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="siparisler-${date}.csv"`,
    },
  });
}
