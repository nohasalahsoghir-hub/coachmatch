"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { updatePassword } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";

type LinkStatus = "checking" | "ready" | "expired";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(updatePassword, { error: null, submitted: false });
  const [linkStatus, setLinkStatus] = useState<LinkStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    const timer = window.setTimeout(() => { if (active) setLinkStatus("expired"); }, 5000);
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      window.clearTimeout(timer);
      setLinkStatus(data.session ? "ready" : "expired");
    }).catch(() => {
      if (active) { window.clearTimeout(timer); setLinkStatus("expired"); }
    });
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  const valid = /^(?=.*\d).{8,}$/.test(password) && password === confirm;

  return (
    <main dir="rtl" className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <form action={formAction} className="w-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl">
        <h1 className="text-2xl font-black text-[var(--text)]">تعيين كلمة مرور جديدة</h1>
        {linkStatus === "checking" && <p className="mt-2 text-sm text-[var(--muted)]">بنتحقق من رابط إعادة التعيين...</p>}
        {linkStatus === "expired" && <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100"><p>الرابط انتهت صلاحيته أو لم يعد صالحًا. طلب رابط جديد لإعادة التعيين.</p><Link href="/auth/forgot-password" className="mt-3 inline-flex font-bold text-cobalt-300 hover:underline">طلب رابط جديد</Link></div>}
        {linkStatus === "ready" && <>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">اختيار كلمة مرور من 8 أحرف على الأقل وتحتوي على رقم.</p>
          <label className="mt-5 block text-sm font-bold">كلمة المرور الجديدة<input name="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="field mt-2 w-full" autoComplete="new-password" /></label>
          <label className="mt-4 block text-sm font-bold">تأكيد كلمة المرور<input name="confirm_password" type="password" required value={confirm} onChange={(e)=>setConfirm(e.target.value)} className="field mt-2 w-full" autoComplete="new-password" /></label>
          {confirm && !valid && <p className="mt-2 text-xs text-red-300">تأكد من أن كلمة المرور 8 أحرف على الأقل وتحتوي على رقم ومتطابقة.</p>}
          {state.error && <p role="alert" className="mt-3 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}
          <button type="submit" disabled={!valid || pending} className="btn-cobalt mt-4 w-full">{pending ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}</button>
        </>}
        <p className="mt-5 text-center text-sm text-[var(--muted)]"><Link href="/auth/login" className="font-bold text-cobalt-300">تسجيل الدخول</Link></p>
      </form>
    </main>
  );
}
