import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { OrderError } from "./orders";

/** API hatalarını tek tip JSON cevaba çevirir. */
export function handleApiError(err: unknown) {
  if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof ZodError) {
    return NextResponse.json({ error: err.issues[0]?.message ?? "Geçersiz istek" }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
}
