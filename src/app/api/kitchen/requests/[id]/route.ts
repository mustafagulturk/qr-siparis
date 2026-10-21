import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { handleApiError } from "@/lib/api";
import { resolveServiceRequest } from "@/lib/service";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.coerce.number().int().positive().parse((await params).id);
    return NextResponse.json(await resolveServiceRequest(db, id));
  } catch (err) {
    return handleApiError(err);
  }
}
