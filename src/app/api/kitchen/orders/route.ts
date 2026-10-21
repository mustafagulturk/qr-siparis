import { NextResponse } from "next/server";
import { db } from "@/db";
import { getActiveOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getActiveOrders(db));
}
