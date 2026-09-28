"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, Compass, Home } from "lucide-react";

const LINKS = [
  { href: "/",         icon: Home,           label: "الرئيسية" },
  { href: "/coaches",  icon: Compass,        label: "اكتشف"    },
  { href: "/dashboard",icon: CalendarCheck2, label: "حجوزاتي"  },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl md:hidden"
      style={{ borderColor: "var(--line-soft)", background: "rgba(4,11,9,0.92)" }}
    >
      <div className="mx-auto grid max-w-xl grid-cols-3">
        {LINKS.map(({ href, icon: Icon, label }) => {
          const active = path === href || (href !== "/" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              id={`bottom-nav-${label}`}
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors"
              style={{ color: active ? "var(--cobalt)" : "var(--muted-2)" }}
            >
              <Icon
                size={20}
                style={{
                  filter: active ? "drop-shadow(0 0 6px var(--cobalt))" : "none",
                  transition: "filter 0.2s",
                }}
              />
              <span>{label}</span>
              {active && (
                <span
                  className="absolute bottom-0 h-0.5 w-8 rounded-full"
                  style={{ background: "var(--cobalt)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
