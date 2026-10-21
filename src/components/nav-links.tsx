"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 text-sm">
      {links.map((l) => {
        const active = l.href === "/yonetim" ? path === l.href : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cx(
              "rounded-lg px-3 py-1.5 font-medium transition",
              active ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-100",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
