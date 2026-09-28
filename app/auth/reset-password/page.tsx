"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { updatePassword } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, { error: null as string | null });
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
  }, []);

  const valid = /^(?=.*\d).{8,}$/.test(password) && password === confirm;

  return (
    <main dir="rtl" className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <form action={formAction} className="w-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl">
        <h1 className="text-2xl font-black text-[var(--text)]">تعيين كلمة مرور جديدة</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">اختاري كلمة مرور من 8 أحرف على الأقل وتحتوي على رقم.</p>
        <label className="mt-5 block text-sm font-bold">
          كلمة المرور الجديدة
          <input name="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="field mt-2 w-full" autoComplete="new-password" />
        </label>
        <label className="mt-4 block text-sm font-bold">
          تأكيد كلمة المرور
          <input name="confirm_password" type="password" required value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="field mt-2 w-full" autoComplete="new-password" />
        </label>
        {confirm && !valid && <p className="mt-2 text-xs text-red-300">تأكدي من أن كلمة المرور 8 أحرف على الأقل وتحتوي على رقم ومتطابقة.</p>}
        {!ready && <p className="mt-3 text-xs text-[var(--muted-2)]">بنتحقق من رابط إعادة التعيين...</p>}
        {state.error && <p role="alert" className="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}
        <button type="submit" disabled={!ready || !valid || pending} className="btn-cobalt mt-4 w-full">
          {pending ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
        </button>
        <p className="mt-5 text-center text-sm text-[var(--muted)]"><Link href="/auth/login" className="font-bold text-cobalt-300">تسجيل الدخول</Link></p>
      </form>
    </main>
  );
}
