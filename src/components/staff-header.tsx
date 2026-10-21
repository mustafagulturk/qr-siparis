import Link from "next/link";
import { logout } from "@/app/giris/actions";
import type { Session } from "@/lib/auth";

const LINKS = [
  { href: "/mutfak", label: "Mutfak", roles: ["admin", "kitchen"] },
  { href: "/yonetim", label: "Özet", roles: ["admin"] },
  { href: "/yonetim/menu", label: "Menü", roles: ["admin"] },
  { href: "/yonetim/masalar", label: "Masalar & QR", roles: ["admin"] },
];

export function StaffHeader({ session }: { session: Session }) {
  return (
    <header className="border-b border-stone-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3">
        <Link href="/" className="font-bold text-brand-700">
          🍽️ QR Sipariş
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {LINKS.filter((l) => l.roles.includes(session.role)).map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 hover:bg-stone-100">
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-stone-500">{session.name}</span>
          <button className="rounded-lg px-3 py-1.5 text-stone-600 hover:bg-stone-100">Çıkış</button>
        </form>
      </div>
    </header>
  );
}
