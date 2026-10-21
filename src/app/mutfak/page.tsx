import type { Metadata } from "next";
import { StaffHeader } from "@/components/staff-header";
import { db } from "@/db";
import { requireRole } from "@/lib/auth";
import { getActiveOrders } from "@/lib/orders";
import { getOpenServiceRequests } from "@/lib/service";
import { KitchenBoard } from "./kitchen-board";

export const metadata: Metadata = { title: "Mutfak" };
export const dynamic = "force-dynamic";

export default async function KitchenPage() {
  const session = await requireRole("admin", "kitchen");
  const [orders, requests] = await Promise.all([getActiveOrders(db), getOpenServiceRequests(db)]);
  return (
    <>
      <StaffHeader session={session} />
      <KitchenBoard
        initial={JSON.parse(JSON.stringify(orders))}
        initialRequests={JSON.parse(JSON.stringify(requests))}
      />
    </>
  );
}
