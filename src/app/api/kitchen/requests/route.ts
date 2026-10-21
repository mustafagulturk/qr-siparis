import { NextResponse } from "next/server";
import { db } from "@/db";
import { getOpenServiceRequests } from "@/lib/service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getOpenServiceRequests(db));
}
