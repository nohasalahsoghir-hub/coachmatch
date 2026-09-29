"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: null, submitted: false });

  return (
    <main dir="rtl" className="mx-auto flex min-h-[70vh] items-center justify-center px-4 py-10">
      <form action={formAction} className="w-full max-w-sm rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl">
        <h1 className="text-2xl font-black text-[var(--text)]">تسجيل الدخول</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">ادخلي لحسابك وكمّلي رحلتك مع CoachMatch.</p>
        <label className="mt-5 block text-sm font-bold text-[var(--text)]">
          البريد الإلكتروني
          <input name="email" type="email" required className="field mt-2 w-full" autoComplete="email" />
        </label>
        <label className="mt-4 block text-sm font-bold text-[var(--text)]">
          كلمة المرور
          <input name="password" type="password" required className="field mt-2 w-full" autoComplete="current-password" />
        </label>
        <div className="mt-2 flex justify-end">
          <Link href="/auth/forgot-password" className="text-xs font-bold text-cobalt-300 hover:underline">نسيت كلمة المرور؟</Link>
        </div>
        {state.error && <div role="alert" className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300">{state.error}</div>}
        <button type="submit" disabled={pending} className="btn-cobalt mt-4 w-full">{pending ? "جارٍ الدخول..." : "دخول"}</button>
        <p className="mt-5 text-center text-sm text-[var(--muted)]">مالك حساب؟{" "}<Link href="/auth/sign-up" className="font-bold text-cobalt-300">سجّل الآن</Link></p>
      </form>
    </main>
  );
}
