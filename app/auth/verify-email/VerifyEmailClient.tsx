"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailClient({ email }: { email: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resendEmail() {
    if (!email || pending) return;

    setPending(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setPending(false);

    if (resendError) {
      setError("مش قادرين نبعت الرسالة دلوقتي. حاول تاني بعد شوية.");
      return;
    }

    setMessage("اتبعث إيميل تأكيد جديد. راجع Inbox وSpam كمان.");
  }

  return (
    <main dir="rtl" className="flex min-h-[70vh] items-center justify-center px-4">
      <section className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <MailCheck className="size-7" aria-hidden />
        </div>

        <h1 className="text-2xl font-bold text-white">تم إنشاء حسابك!</h1>

        <p className="mt-3 text-base leading-7 text-neutral-300">
          افتح إيميلك وادوس على رابط التأكيد عشان تقدر تسجل دخول.
        </p>

        {email && (
          <p className="mt-4 break-all rounded-lg bg-neutral-800 px-3 py-2 text-sm text-neutral-200">
            {email}
          </p>
        )}

        <button
          type="button"
          onClick={resendEmail}
          disabled={!email || pending}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden />
          {pending ? "جارٍ الإرسال..." : "لم يصلك الإيميل؟ أعد الإرسال"}
        </button>

        {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <p className="mt-6 text-sm text-neutral-400">
          بعد التأكيد،{" "}
          <Link href="/auth/login" className="text-emerald-400 hover:underline">
            ارجع لتسجيل الدخول
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
