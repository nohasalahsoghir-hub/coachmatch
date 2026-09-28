"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/auth/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: null });

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-neutral-900 p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white">تسجيل الدخول</h1>

        <div className="space-y-1">
          <label className="text-sm text-neutral-400">البريد الإلكتروني</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-400">كلمة المرور</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "جارٍ الدخول..." : "دخول"}
        </button>

        <p className="text-center text-sm text-neutral-400">
          مالك حساب؟{" "}
          <Link href="/auth/sign-up" className="text-emerald-400">
            سجّل الآن
          </Link>
        </p>
      </form>
    </div>
  );
}
