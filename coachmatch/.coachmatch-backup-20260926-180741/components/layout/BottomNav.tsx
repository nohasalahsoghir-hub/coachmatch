"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, CalendarDays, User } from "lucide-react";

const items = [
  { href: "/dashboard", label: "الرئيسية", icon: Home },
  { href: "/coaches", label: "اكتشف", icon: Search },
  { href: "/coach/dashboard", label: "المدربين", icon: CalendarDays },
  { href: "/dashboard", label: "حسابي", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-3xl justify-around py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                active ? "text-emerald-400" : "text-neutral-500"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
