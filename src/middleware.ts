import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth-edge";

// Personel sayfalarını korur. Rol kontrolü sayfaların içinde de tekrar yapılır.
export async function middleware(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Giriş yapmanız gerekiyor" }, { status: 401 });
  }
  const url = new URL("/giris", req.url);
  url.searchParams.set("sonra", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/mutfak/:path*", "/yonetim/:path*", "/api/kitchen/:path*", "/api/orders/:id/status"],
};
