import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { handleApiError } from "@/lib/api";
import { createReview, reviewSchema } from "@/lib/service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = z.uuid().parse((await params).id);
    const review = await createReview(db, id, reviewSchema.parse(await req.json()));
    return NextResponse.json(review, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
