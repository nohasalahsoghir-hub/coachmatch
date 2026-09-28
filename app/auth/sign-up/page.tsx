"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, { error: null });
  const [role, setRole] = useState<"athlete" | "coach">("athlete");

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-neutral-900 p-6 shadow-xl"
      >
        <h1 className="text-2xl font-bold text-white">إنشاء حساب جديد</h1>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("athlete")}
            className={`rounded-lg py-2 text-sm font-semibold ${
              role === "athlete" ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"
            }`}
          >
            رياضي / متدرب
          </button>
          <button
            type="button"
            onClick={() => setRole("coach")}
            className={`rounded-lg py-2 text-sm font-semibold ${
              role === "coach" ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"
            }`}
          >
            مدرب
          </button>
        </div>
        <input type="hidden" name="role" value={role} />

        <div className="space-y-1">
          <label className="text-sm text-neutral-400">الاسم الكامل</label>
          <input
            name="full_name"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-400">رقم الهاتف</label>
          <input
            name="phone"
            placeholder="01012345678"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

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
            minLength={6}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
        </button>

        <p className="text-center text-sm text-neutral-400">
          عندك حساب بالفعل؟{" "}
          <Link href="/auth/login" className="text-emerald-400">
            سجّل الدخول
          </Link>
        </p>
      </form>
    </div>
  );
}
