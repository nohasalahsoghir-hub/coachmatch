import Link from "next/link";
import { Search, UserRound, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  const { data: profile } = user
    ? await s.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const home =
    profile?.role === "coach" ? "/coach/dashboard"
    : profile?.role === "admin" ? "/admin"
    : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b backdrop-blur-xl"
      style={{ borderColor: "var(--line-soft)", background: "rgba(4,11,9,0.85)" }}>
      <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-black tracking-tight" id="header-logo">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black transition-transform hover:scale-105"
            style={{ background: "var(--flare)", color: "#1a0800" }}>
            <Zap size={16} fill="currentColor" />
          </span>
          <span className="font-display text-base font-bold" style={{ fontFamily: "var(--font-changa)" }}>
            Coach<span style={{ color: "var(--flare)" }}>Match</span>
          </span>
        </Link>

        {/* Search bar — desktop */}
        <div className="hidden flex-1 md:block">
          <form action="/coaches" className="mx-auto flex max-w-sm items-center gap-2 rounded-2xl border px-3 transition-all focus-within:border-[var(--flare)]"
            style={{ borderColor: "var(--line)", background: "var(--surface-3)" }}>
            <Search size={14} style={{ color: "var(--muted-2)" }} />
            <input
              name="q"
              className="min-h-10 w-full bg-transparent text-sm outline-none"
              placeholder="ابحث عن رياضة أو مدرب..."
              aria-label="البحث عن مدرب"
              style={{ color: "var(--text)" }}
            />
          </form>
        </div>

        {/* Nav */}
        <nav className="mr-auto flex items-center gap-1 text-sm font-bold">
          <Link
            className="hidden rounded-xl px-3 py-2 transition-colors sm:block"
            style={{ color: "var(--muted)" }}
            href="/coaches"
            id="nav-coaches"
          >
            المدربين
          </Link>

          {user ? (
            <Link
              className="btn-flare min-h-10 text-sm"
              href={home}
              id="nav-dashboard"
            >
              <UserRound size={14} />
              {profile?.role === "admin" ? "الإدارة"
               : profile?.role === "coach" ? "لوحة المدرب"
               : "حسابي"}
            </Link>
          ) : (
            <>
              <Link
                className="hidden min-h-10 items-center rounded-xl px-3 transition-colors sm:inline-flex"
                style={{ color: "var(--muted)" }}
                href="/auth/sign-up"
                id="nav-signup"
              >
                إنشاء حساب
              </Link>
              <Link
                className="inline-flex min-h-10 items-center rounded-2xl border px-4 text-sm font-bold transition-all hover:border-[var(--flare)] hover:text-[var(--flare)]"
                style={{ borderColor: "var(--line)", color: "var(--muted)" }}
                href="/auth/login"
                id="nav-login"
              >
                دخول
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
