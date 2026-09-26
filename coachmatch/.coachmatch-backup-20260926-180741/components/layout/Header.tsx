import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-extrabold text-emerald-400">
          CoachMatch
        </Link>

        {user ? (
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
            >
              <LogOut size={16} />
              خروج
            </button>
          </form>
        ) : (
          <Link href="/auth/login" className="text-sm text-emerald-400">
            تسجيل الدخول
          </Link>
        )}
      </div>
    </header>
  );
}
