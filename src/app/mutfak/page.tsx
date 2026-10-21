import type { Metadata } from "next";
import { StaffHeader } from "@/components/staff-header";
import { db } from "@/db";
import { requireRole } from "@/lib/auth";
import { getActiveOrders } from "@/lib/orders";
import { KitchenBoard } from "./kitchen-board";

export const metadata: Metadata = { title: "Mutfak" };
export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const session = await requireRole("admin", "kitchen");
  const orders = await getActiveOrders(db);
  return (
    <>
      <StaffHeader session={session} />
      <KitchenBoard initial={JSON.parse(JSON.stringify(orders))} />
    </>
  );
}
