"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp } from "@/app/auth/actions";

export default function SignUpPage() {
  const [state, formAction, pending] = useActionState(signUp, { error: null as string | null });
  const [role, setRole] = useState<"athlete" | "coach">("athlete");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const strongPassword = /^(?=.*\d).{8,}$/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = strongPassword && passwordsMatch && termsAccepted && !pending;

  return (
    <main dir="rtl" className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-4 py-10">
      <form action={formAction} className="w-full space-y-4 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-[var(--text)]">إنشاء حساب جديد</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">رحلة جديدة تبدأ مع CoachMatch.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setRole("athlete")} className={`min-h-11 rounded-2xl text-sm font-bold transition ${role==="athlete" ? "bg-cobalt-500 text-white" : "bg-[var(--charcoal-900)] text-[var(--muted)]"}`}>
            رياضي / متدرب
          </button>
          <button type="button" onClick={() => setRole("coach")} className={`min-h-11 rounded-2xl text-sm font-bold transition ${role==="coach" ? "bg-cobalt-500 text-white" : "bg-[var(--charcoal-900)] text-[var(--muted)]"}`}>
            مدرب
          </button>
        </div>
        <input type="hidden" name="role" value={role} />

        {role === "coach" && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-200">
            حسابك هيتراجع من فريقنا قبل ما يظهر للمتدربين — هنكلمك خلال 3 أيام.
          </div>
        )}

        <label className="block text-sm font-bold text-[var(--text)]">
          الاسم الكامل
          <input name="full_name" required className="field mt-2 w-full" autoComplete="name" />
        </label>

        <label className="block text-sm font-bold text-[var(--text)]">
          رقم الهاتف
          <input name="phone" placeholder="01012345678" inputMode="numeric" required pattern="01[0125][0-9]{8}" className="field mt-2 w-full" autoComplete="tel" />
        </label>

        <label className="block text-sm font-bold text-[var(--text)]">
          البريد الإلكتروني
          <input name="email" type="email" required className="field mt-2 w-full" autoComplete="email" />
        </label>

        <label className="block text-sm font-bold text-[var(--text)]">
          كلمة المرور
          <input name="password" type="password" required minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} className="field mt-2 w-full" autoComplete="new-password" />
        </label>

        <label className="block text-sm font-bold text-[var(--text)]">
          تأكيد كلمة المرور
          <input name="confirm_password" type="password" required minLength={8} value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="field mt-2 w-full" autoComplete="new-password" />
        </label>

        {password && !strongPassword && <p className="text-xs text-amber-300">كلمة المرور لازم تكون 8 أحرف على الأقل وتحتوي على رقم.</p>}
        {confirmPassword && <p className={`text-xs ${passwordsMatch ? "text-teal-300" : "text-red-300"}`}>{passwordsMatch ? "كلمتا المرور متطابقتان" : "كلمتا المرور غير متطابقتين"}</p>}

        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]">
          <input name="terms_accepted" type="checkbox" checked={termsAccepted} onChange={(e)=>setTermsAccepted(e.target.checked)} className="mt-1 size-4 accent-[#3E6FF2]" />
          <span>
            أوافق على <Link href="/terms" className="font-bold text-cobalt-300 hover:underline">شروط الاستخدام</Link> و<Link href="/privacy" className="font-bold text-cobalt-300 hover:underline"> سياسة الخصوصية</Link>.
          </span>
        </label>

        {state.error && <p role="alert" className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{state.error}</p>}

        <button type="submit" disabled={!canSubmit} className="btn-cobalt w-full">
          {pending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
        </button>

        <p className="text-center text-sm text-[var(--muted)]">
          عندك حساب بالفعل؟ <Link href="/auth/login" className="font-bold text-cobalt-300">تسجيل الدخول</Link>
        </p>
      </form>
    </main>
  );
}
