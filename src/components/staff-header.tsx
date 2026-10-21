import Link from "next/link";
import { logout } from "@/app/giris/actions";
import type { Session } from "@/lib/auth";
import { NavLinks } from "./nav-links";

const LINKS = [
  { href: "/mutfak", label: "Mutfak", roles: ["admin", "kitchen"] },
  { href: "/yonetim", label: "Özet", roles: ["admin"] },
  { href: "/yonetim/menu", label: "Menü", roles: ["admin"] },
  { href: "/yonetim/masalar", label: "Masalar & QR", roles: ["admin"] },
];

export function StaffHeader({ session }: { session: Session }) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/" className="font-bold text-brand-700">
          🍽️ QR Sipariş
        </Link>
        <NavLinks links={LINKS.filter((l) => l.roles.includes(session.role)).map(({ href, label }) => ({ href, label }))} />
        <form action={logout} className="ml-auto flex items-center gap-3 text-sm">
          <span className="flex items-center gap-2 text-stone-600">
            <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
              {session.name.charAt(0)}
            </span>
            <span className="hidden sm:inline">{session.name}</span>
          </span>
          <button className="rounded-lg px-3 py-1.5 text-stone-600 hover:bg-stone-100">Çıkış</button>
        </form>
      </div>
    </header>
  );
}
