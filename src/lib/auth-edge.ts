import { jwtVerify, SignJWT } from "jose";
import type { Role } from "@/db/schema";

export const SESSION_COOKIE = "oturum";

export type Session = { userId: number; name: string; role: Role };

const secret = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET en az 32 karakter olmalı");
  return new TextEncoder().encode(s);
};

export async function createSessionToken(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
}

export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { userId: payload.userId as number, name: payload.name as string, role: payload.role as Role };
  } catch {
    return null;
  }
}
