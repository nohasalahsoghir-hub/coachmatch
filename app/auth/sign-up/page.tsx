"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Award, Dumbbell, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { signUp } from "@/app/auth/actions";

function SignUpContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const redirectTo = searchParams.get("redirect") || searchParams.get("returnTo") || searchParams.get("next") || "";

  const [state, formAction, pending] = useActionState(signUp, { error: null as string | null });
  const [role, setRole] = useState<"athlete" | "coach">(roleParam === "coach" ? "coach" : "athlete");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (roleParam === "coach") {
      setRole("coach");
    } else if (roleParam === "athlete") {
      setRole("athlete");
    }
  }, [roleParam]);

  const strongPassword = /^(?=.*\d).{8,}$/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = strongPassword && passwordsMatch && termsAccepted && !pending;

  return (
    <main dir="rtl" className="mx-auto flex min-h-[calc(100vh-72px)] max-w-md items-center px-4 py-10">
      <form action={formAction} className="w-full space-y-4 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl">
        {/* Dynamic Context Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "rgba(62,111,242,0.12)", color: "var(--cobalt)" }}>
            {role === "coach" ? <Award size={14} /> : <Dumbbell size={14} />}
            <span>{role === "coach" ? "تسجيل مدرب رياضي" : "تسجيل لاعب / متدرب"}</span>
          </div>
          <h1 className="mt-2 text-2xl font-black text-[var(--text)]">
            {role === "coach" ? "انضم كمدرب معتمد" : "إنشاء حساب متدرب جديد"}
          </h1>
          <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
            {role === "coach"
              ? "أنشئ ملفك المهني، حدد مواعيدك وأسعار حصصك، واستقبل متدربين جدد في محافظتك."
              : "احجز جلساتك الرياضية ونسّق مواعيدك مباشرة مع أفضل المدربين المعتمدين."}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--surface-2)] p-1 border border-[var(--line-soft)]">
          <button
            type="button"
            onClick={() => setRole("athlete")}
            className={`min-h-11 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              role === "athlete"
                ? "bg-[var(--cobalt)] text-white shadow-md shadow-[var(--cobalt)]/25"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            <UserCheck size={14} />
            متدرب / رياضي
          </button>
          <button
            type="button"
            onClick={() => setRole("coach")}
            className={`min-h-11 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
              role === "coach"
                ? "bg-[var(--cobalt)] text-white shadow-md shadow-[var(--cobalt)]/25"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            <Award size={14} />
            مدرب معتمد
          </button>
        </div>

        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="redirect_to" value={redirectTo} />

        {role === "coach" ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-6 text-amber-200">
            💡 سيتم مراجعة بياناتك وخبراتك التدريبية قبل إتاحة جدولك للمتدربين لضمان أعلى معايير الجودة وموثوقية المنصة.
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-2.5 text-xs text-[var(--muted)] flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
            <span>حسابك مؤمّن بضمان استرداد فوري 100% وحماية كاملة لمدفوعات الحجز.</span>
          </div>
        )}

        <label className="block text-xs font-bold text-[var(--text)]">
          الاسم الكامل
          <input name="full_name" required className="field mt-1.5 w-full" autoComplete="name" placeholder={role === "coach" ? "كابتن أحمد محمد" : "أحمد محمد"} />
        </label>

        <label className="block text-xs font-bold text-[var(--text)]">
          رقم الهاتف (فودافون كاش / انستاباي / واتساب)
          <input
            name="phone"
            placeholder="01012345678"
            inputMode="numeric"
            required
            pattern="01[0125][0-9]{8}"
            className="field mt-1.5 w-full font-mono text-sm"
            autoComplete="tel"
          />
        </label>

        <label className="block text-xs font-bold text-[var(--text)]">
          البريد الإلكتروني
          <input name="email" type="email" required className="field mt-1.5 w-full font-mono text-sm" autoComplete="email" placeholder="example@email.com" />
        </label>

        <label className="block text-xs font-bold text-[var(--text)]">
          كلمة المرور
          <input
            name="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field mt-1.5 w-full font-mono text-sm"
            autoComplete="new-password"
          />
        </label>

        <label className="block text-xs font-bold text-[var(--text)]">
          تأكيد كلمة المرور
          <input
            name="confirm_password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="field mt-1.5 w-full font-mono text-sm"
            autoComplete="new-password"
          />
        </label>

        {password && !strongPassword && (
          <p className="text-xs text-amber-300">كلمة المرور لازم تكون 8 أحرف على الأقل وتحتوي على رقم واحد.</p>
        )}
        {confirmPassword && (
          <p className={`text-xs ${passwordsMatch ? "text-emerald-400" : "text-rose-400"}`}>
            {passwordsMatch ? "كلمتا المرور متطابقتان ✓" : "كلمتا المرور غير متطابقتين"}
          </p>
        )}

        <label className="flex items-start gap-2.5 text-xs leading-5 text-[var(--muted)]">
          <input
            name="terms_accepted"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 size-4 accent-[var(--cobalt)]"
          />
          <span>
            أوافق على{" "}
            <Link href="/terms" className="font-bold text-[var(--cobalt)] hover:underline">
              شروط الاستخدام
            </Link>{" "}
            و
            <Link href="/privacy" className="font-bold text-[var(--cobalt)] hover:underline">
              سياسة الخصوصية
            </Link>
            .
          </span>
        </label>

        {state.error && (
          <p role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={!canSubmit} className="btn-cobalt w-full min-h-12 text-sm font-black shadow-lg shadow-[var(--cobalt)]/25">
          {pending ? "جارٍ إنشاء الحساب..." : role === "coach" ? "إنشاء حساب كمدرب" : "إنشاء حساب كمتدرب"}
        </button>

        <p className="text-center text-xs text-[var(--muted)]">
          لديك حساب بالفعل؟{" "}
          <Link
            href={`/auth/login?role=${role}${redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-bold text-[var(--cobalt)] hover:underline"
          >
            تسجيل الدخول
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-[var(--muted)]">جارٍ تحميل نموذج التسجيل...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
