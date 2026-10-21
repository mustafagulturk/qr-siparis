import { NextResponse } from "next/server";
import { db } from "@/db";
import { handleApiError } from "@/lib/api";
import { createOrder, createOrderSchema } from "@/lib/orders";

export async function POST(req: Request) {
  try {
    const input = createOrderSchema.parse(await req.json());
    const order = await createOrder(db, input);
    return NextResponse.json({ id: order.id, number: order.number }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
