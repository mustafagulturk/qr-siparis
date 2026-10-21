"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return "E-posta veya şifre hatalı";

  const token = await createSessionToken({ userId: user.id, name: user.name, role: user.role });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });

  const next = String(form.get("sonra") ?? "");
  const fallback = user.role === "admin" ? "/yonetim" : "/mutfak";
  // Açık yönlendirme açığını önlemek için yalnızca site içi yollara izin ver
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : fallback);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/giris");
}
