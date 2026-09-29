"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Award, Dumbbell, LogIn } from "lucide-react";
import { login } from "@/app/auth/actions";

function LoginContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const redirectTo = searchParams.get("redirect") || searchParams.get("returnTo") || searchParams.get("next") || "";

  const [state, formAction, pending] = useActionState(login, { error: null, submitted: false });
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "reset-link") {
      setLinkMessage("الرابط انتهت صلاحيته أو لم يعد صالحًا. يمكن طلب رابط جديد لإعادة تعيين كلمة المرور.");
    }
    if (searchParams.get("reset") === "success") {
      setLinkMessage("تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.");
    }
  }, [searchParams]);

  const isCoach = roleParam === "coach";

  return (
    <main dir="rtl" className="mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
      <form action={formAction} className="w-full max-w-sm rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl">
        {/* Role badge if passed */}
        {roleParam && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "rgba(62,111,242,0.12)", color: "var(--cobalt)" }}>
            {isCoach ? <Award size={14} /> : <Dumbbell size={14} />}
            <span>{isCoach ? "تسجيل دخول المدرب" : "تسجيل دخول المتدرب"}</span>
          </div>
        )}

        <h1 className="text-2xl font-black text-[var(--text)]">تسجيل الدخول</h1>
        <p className="mt-1.5 text-xs leading-6 text-[var(--muted)]">
          {isCoach
            ? "ادخل لحسابك كمدرب لإدارة جدول حصصك واستقبال المتدربين."
            : "ادخل لحسابك لمتابعة تدريباتك وحجوزاتك المؤكدة."}
        </p>

        <input type="hidden" name="redirect_to" value={redirectTo} />

        <label className="mt-5 block text-xs font-bold text-[var(--text)]">
          البريد الإلكتروني
          <input name="email" type="email" required className="field mt-1.5 w-full font-mono text-sm" autoComplete="email" placeholder="example@email.com" />
        </label>

        <label className="mt-4 block text-xs font-bold text-[var(--text)]">
          كلمة المرور
          <input name="password" type="password" required className="field mt-1.5 w-full font-mono text-sm" autoComplete="current-password" />
        </label>

        <div className="mt-2 flex justify-end">
          <Link href="/auth/forgot-password" className="text-xs font-bold text-[var(--cobalt)] hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </div>

        {linkMessage && (
          <div role="status" className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-6 text-amber-100">
            {linkMessage}
          </div>
        )}

        {state.error && (
          <div role="alert" className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs leading-6 text-rose-300">
            {state.error}
          </div>
        )}

        <button type="submit" disabled={pending} className="btn-cobalt mt-5 w-full min-h-12 text-sm font-black shadow-lg shadow-[var(--cobalt)]/25">
          {pending ? "جارٍ تسجيل الدخول..." : "دخول"}
        </button>

        <p className="mt-5 text-center text-xs text-[var(--muted)]">
          ليس لديك حساب بعد؟{" "}
          <Link
            href={`/auth/sign-up?role=${roleParam || "athlete"}${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-bold text-[var(--cobalt)] hover:underline"
          >
            {isCoach ? "سجّل كمدرب جديد" : "سجّل كمتدرب جديد"}
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-[var(--muted)]">جارٍ تحميل صفحة الدخول...</div>}>
      <LoginContent />
    </Suspense>
  );
}
