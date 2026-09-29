"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, Loader2, X } from "lucide-react";
import { completeBooking } from "@/lib/actions/bookings";

interface ConfirmAttendanceButtonProps {
  bookingId: string;
  isPastSession?: boolean;
  endTimeLabel?: string;
}

export function ConfirmAttendanceButton({
  bookingId,
  isPastSession = true,
  endTimeLabel,
}: ConfirmAttendanceButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // If the session hasn't finished yet according to schedule, prevent premature completion
  if (!isPastSession) {
    return (
      <div className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 text-[11px] font-bold text-[var(--muted-2)] cursor-not-allowed select-none" title="لا يمكن تسجيل حضور جلسة قبل حلول موعد انتهائها">
        <CheckCircle2 size={13} className="text-[var(--muted-2)] opacity-60" />
        <span>متاح بعد الانتهاء {endTimeLabel ? `(${endTimeLabel})` : ""}</span>
      </div>
    );
  }

  if (success) {
    return (
      <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-300">
        <Check size={14} />
        تم تسجيل اكتمال الحصة بنجاح
      </span>
    );
  }

  const handleComplete = () => {
    setError("");
    startTransition(async () => {
      try {
        await completeBooking(bookingId);
        setSuccess(true);
        router.refresh();
      } catch (err: unknown) {
        const raw = err instanceof Error ? err.message : "تعذر تسجيل اكتمال الجلسة";
        if (raw.includes("قبل موعد انتهائها")) {
          setError("لا يمكن إنهاء الحصة قبل موعد انتهائها الفعلي.");
        } else if (raw.includes("المكتمل")) {
          setError("تم تسجيل اكتمال هذه الحصة مسبقاً.");
          setSuccess(true);
        } else {
          setError(raw);
        }
        setConfirming(false);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      {error && (
        <span role="alert" className="text-[11px] font-bold text-rose-300">
          {error}
        </span>
      )}

      {confirming ? (
        <div className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-500/40 bg-[var(--surface-2)] p-1 shadow-lg">
          <span className="px-2 text-[11px] font-black text-emerald-300">
            تأكيد إنهاء الحصة؟
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={handleComplete}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:opacity-50"
            title="نعم، اكتملت الحصة"
            aria-label="تأكيد اكتمال الحصة"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming(false)}
            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl bg-white/5 text-[var(--muted)] transition hover:bg-white/10 hover:text-white"
            title="إلغاء"
            aria-label="إلغاء التأكيد"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => setConfirming(true)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--cobalt)] px-4 text-xs font-black text-white shadow-md shadow-[var(--cobalt)]/25 transition-all hover:bg-cobalt-400 active:scale-[0.98] disabled:opacity-50"
        >
          <CheckCircle2 size={14} />
          <span>تسجيل اكتمال الجلسة</span>
        </button>
      )}
    </div>
  );
}
