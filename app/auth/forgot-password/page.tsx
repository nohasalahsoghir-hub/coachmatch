"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/app/auth/actions";

const initialState = { error: null as string | null, submitted: false };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);
  const sent = Boolean(state.submitted);

  return (
    <main dir="rtl" className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <form action={formAction} className="w-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl">
        <h1 className="text-2xl font-black text-[var(--text)]">نسيت كلمة المرور؟</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">أدخل البريد الإلكتروني وسيصلك رابط لتعيين كلمة مرور جديدة.</p>
        <label className="mt-5 block text-sm font-bold text-[var(--text)]">
          البريد الإلكتروني
          <input name="email" type="email" required className="field mt-2 w-full" autoComplete="email" />
        </label>
        <button disabled={pending} className="btn-cobalt mt-4 w-full">{pending ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}</button>
        {state.error && <p role="alert" className="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}
        {sent && !pending && <p role="status" className="mt-3 rounded-2xl bg-teal-500/10 p-3 text-sm text-teal-200">إذا كان البريد مسجلًا، ستصل رسالة إعادة التعيين. يُرجى مراجعة Inbox وSpam.</p>}
        <p className="mt-5 text-center text-sm text-[var(--muted)]"><Link href="/auth/login" className="font-bold text-cobalt-300">العودة لتسجيل الدخول</Link></p>
      </form>
    </main>
  );
}
