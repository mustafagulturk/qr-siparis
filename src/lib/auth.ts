import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/db/schema";
import { SESSION_COOKIE, verifySessionToken } from "./auth-edge";

export { SESSION_COOKIE, createSessionToken, type Session } from "./auth-edge";

export async function getSession() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Sayfalarda kullanılır: yetkisi olmayanı giriş sayfasına yollar. */
export async function requireRole(...roles: Role[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) redirect("/giris");
  return session;
}
