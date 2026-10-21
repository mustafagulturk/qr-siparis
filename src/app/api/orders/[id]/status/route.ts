import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orderStatusEnum } from "@/db/schema";
import { handleApiError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/orders";

const bodySchema = z.object({ status: z.enum(orderStatusEnum.enumValues) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  try {
    const { id } = await params;
    const { status } = bodySchema.parse(await req.json());
    const order = await updateOrderStatus(db, z.uuid().parse(id), status);
    return NextResponse.json(order);
  } catch (err) {
    return handleApiError(err);
  }
}
