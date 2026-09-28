"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, { error: null });
  const [role, setRole] = useState<"athlete" | "coach">("athlete");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = passwordsMatch && termsAccepted && !pending;

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

        {role === "coach" && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm leading-6 text-amber-200">
            حسابك هيتراجع من فريقنا قبل ما يظهر للمتدربين — هنكلمك خلال 3 أيام.
          </div>
        )}

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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-400">تأكيد كلمة المرور</label>
          <input
            name="confirm_password"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
          />
          {confirmPassword.length > 0 && (
            <p className={`text-xs ${passwordsMatch ? "text-emerald-400" : "text-red-400"}`}>
              {passwordsMatch ? "كلمتا المرور متطابقتان" : "كلمتا المرور غير متطابقتين"}
            </p>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm leading-6 text-neutral-400">
          <input
            name="terms_accepted"
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-1 size-4 accent-emerald-600"
          />
          <span>
            أوافق على{" "}
            <Link href="/terms" className="text-emerald-400 hover:underline">
              شروط الاستخدام
            </Link>{" "}
            و{" "}
            <Link href="/privacy" className="text-emerald-400 hover:underline">
              سياسة الخصوصية
            </Link>
            .
          </span>
        </label>

        {state.error && <p className="text-sm text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
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
