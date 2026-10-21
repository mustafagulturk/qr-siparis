import { NextResponse } from "next/server";
import { db } from "@/db";
import { handleApiError } from "@/lib/api";
import { createServiceRequest, serviceSchema } from "@/lib/service";

export async function POST(req: Request) {
  try {
    const { request, duplicate } = await createServiceRequest(db, serviceSchema.parse(await req.json()));
    return NextResponse.json({ id: request.id, duplicate }, { status: duplicate ? 200 : 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
