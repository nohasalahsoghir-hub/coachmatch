"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[CoachMatch] Route error", error);
  }, [error]);

  return (
    <main dir="rtl" className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-10 text-center">
      <section className="w-full rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-8 shadow-xl">
        <p className="text-xs font-black text-cobalt-300">حصلت مشكلة</p>
        <h1 className="mt-3 text-2xl font-black">حصل خطأ غير متوقع</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--muted)]">الحالة غير مؤكدة، لذلك يُفضّل التحقق من الصفحة قبل تكرار أي عملية للحجز أو الحساب.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse sm:justify-center">
          <button type="button" onClick={() => reset()} className="btn-cobalt">إعادة المحاولة</button>
          <Link href="/" className="btn-ghost">العودة للرئيسية</Link>
        </div>
      </section>
    </main>
  );
}
