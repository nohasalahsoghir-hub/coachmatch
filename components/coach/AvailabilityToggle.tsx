"use client";

import { useState, useTransition } from "react";
import { CalendarCheck2, Lock, ShieldAlert } from "lucide-react";
import { setCoachBookingAcceptance } from "@/lib/actions/coach";

export function AvailabilityToggle({
  initial,
  isVerified,
}: {
  initial: boolean;
  isVerified: boolean;
}) {
  const [active, setActive] = useState(initial && isVerified);
  const [busy, start] = useTransition();
  const [error, setError] = useState("");

  const toggle = () => {
    if (!isVerified) return;
    start(async () => {
      setError("");
      try {
        setActive(await setCoachBookingAcceptance(!active));
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر تحديث الحالة");
      }
    });
  };

  if (!isVerified) {
    return (
      <div className="space-y-2">
        <div
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 text-xs font-black text-amber-200 cursor-not-allowed"
          title="يتطلب توثيق الحساب أولاً"
        >
          <Lock size={15} className="text-amber-400" />
          <span>استقبال الحجوزات معلّق (بانتظار التوثيق)</span>
        </div>
        <p className="text-[11px] text-amber-200/70 max-w-xs leading-5">
          سيتم فتح زر الحجوزات تلقائيًا بمجرد اعتماد وثائقك وسيرتك الذاتية من إدارة المنصة لضمان أمان المتدربين.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        className={`inline-flex min-h-12 items-center gap-2 rounded-2xl px-5 text-xs font-black transition-all ${
          active
            ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-md shadow-emerald-500/10"
            : "border border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--cobalt)]/40 hover:text-white"
        }`}
      >
        <CalendarCheck2 size={16} className={active ? "text-emerald-400" : "text-[var(--muted-2)]"} />
        {busy
          ? "جارٍ التحديث..."
          : active
          ? "استقبال الحجوزات مفعّل ومتاح للجمهور"
          : "استقبال الحجوزات متوقف مؤقتًا"}
      </button>
      <p className="text-[11px] text-[var(--muted-2)] max-w-xs leading-5">
        {active
          ? "يستطيع المتدربون الآن حجز المواعيد المتاحة في جدولك الأسبوعي والدفع عبر المنصة."
          : "لن تظهر أوقات فراغك للحجز الجديد حتى تعيد تفعيل الاستقبال."}
      </p>
      {error && <p role="alert" className="text-[11px] text-rose-300">{error}</p>}
    </div>
  );
}

