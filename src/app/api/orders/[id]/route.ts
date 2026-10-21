import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { getOrder } from "@/lib/orders";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  const order = await getOrder(db, id);
  if (!order) return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  return NextResponse.json(order);
}
