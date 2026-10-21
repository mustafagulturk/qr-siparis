import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { getOrder } from "@/lib/orders";
import { OrderTracker } from "./order-tracker";

export const metadata: Metadata = { title: "Sipariş takibi" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const order = await getOrder(db, id);
  if (!order) notFound();
  return <OrderTracker initial={JSON.parse(JSON.stringify(order))} />;
}
