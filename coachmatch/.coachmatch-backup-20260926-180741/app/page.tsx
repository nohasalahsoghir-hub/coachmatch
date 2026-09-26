import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    redirect(profile?.role === "coach" ? "/coach/dashboard" : "/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <h1 className="text-3xl font-extrabold text-emerald-400">CoachMatch</h1>
      <p className="max-w-xs text-neutral-400">
        احجز مدرب رياضي موثوق في الجيم، السباحة، أو الفنون القتالية — بضغطة واحدة
      </p>
      <div className="flex gap-3">
        <Link href="/auth/sign-up" className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold">
          ابدأ الآن
        </Link>
        <Link href="/auth/login" className="rounded-lg border border-neutral-700 px-6 py-2.5">
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
