"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Clock3, MessageCircle, User, MapPin, CalendarDays } from "lucide-react";
import { adminConfirmManualBooking, adminRejectManualBooking } from "@/lib/actions/admin";

export interface PendingBookingItem {
  id: string;
  reference_code: string;
  athlete_name: string;
  athlete_phone: string;
  coach_name: string;
  coach_sports: string[];
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  total_amount: number;
  hold_expires_at: string;
  created_at: string;
}

export function PendingBookingCard({ item }: { item: PendingBookingItem }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cleanPhone = (item.athlete_phone || "").replace(/\D/g, "");
  const athleteWaPhone = cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone;
  const athleteWaLink = athleteWaPhone ? `https://wa.me/${athleteWaPhone}` : null;

  const handleConfirm = () => {
    if (!confirm(`هل أنت متأكد من استلام مبلغ ${Number(item.total_amount).toLocaleString("ar-EG")} ج.م لحسابك وتأكيد الحجز (${item.reference_code})؟`)) {
      return;
    }
    setError(null);
    start(async () => {
      try {
        await adminConfirmManualBooking(item.id, "instapay", item.reference_code);
        setSuccess("تم تأكيد الحجز وتثبيته في جدول الكابتن بنجاح! ✅");
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر تأكيد الحجز");
      }
    });
  };

  const handleReject = () => {
    const reason = prompt("يرجى كتابة سبب الإلغاء (سيصل في إشعار للمتدرب):", "لم يتم استلام تحويل المبلغ عبر واتساب");
    if (reason === null) return;
    setError(null);
    start(async () => {
      try {
        await adminRejectManualBooking(item.id, reason);
        setSuccess("تم إلغاء الطلب وفك الموعد في جدول الكابتن فوراً. ❌");
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر إلغاء الطلب");
      }
    });
  };

  if (success) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[var(--surface)] p-5 text-sm font-bold text-emerald-300">
        {success}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[var(--surface)] p-5 shadow-lg transition-all hover:border-white/20">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-black text-amber-300 bg-amber-400/10 px-3 py-1 rounded-xl">
            {item.reference_code || `CM-${item.id.slice(0, 6).toUpperCase()}`}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#84988f]">
            <Clock3 size={13} />
            <span>طلب معلق</span>
          </span>
        </div>
        <div className="font-display text-base font-black text-white">
          {Number(item.total_amount).toLocaleString("ar-EG")} ج.م
        </div>
      </div>

      {/* Parties Info */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Athlete */}
        <div className="rounded-2xl bg-[#07110e] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#71867c]">المتدرب (اللاعب):</span>
            {athleteWaLink && (
              <a
                href={athleteWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-[#25D366]/15 px-2 py-0.5 text-[10px] font-bold text-[#25D366] hover:bg-[#25D366]/25"
              >
                <MessageCircle size={12} />
                <span>شات واتساب</span>
              </a>
            )}
          </div>
          <div className="mt-1 font-bold text-white text-sm">{item.athlete_name}</div>
          <div className="mt-0.5 text-[11px] text-[#84988f]">{item.athlete_phone || "بدون رقم هاتف"}</div>
        </div>

        {/* Coach */}
        <div className="rounded-2xl bg-[#07110e] p-3 text-xs">
          <span className="text-[10px] text-[#71867c]">الكابتن (المدرب):</span>
          <div className="mt-1 font-bold text-white text-sm">{item.coach_name}</div>
          <div className="mt-0.5 text-[11px] text-[#84988f]">
            {(item.coach_sports || []).join(" · ") || "رياضة"}
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="mt-3 flex flex-wrap gap-4 rounded-xl border border-white/5 bg-[#07110e] p-3 text-xs text-[#84988f]">
        <div className="flex items-center gap-1.5 text-white">
          <CalendarDays size={14} className="text-amber-300" />
          <span>{item.session_date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white">
          <Clock3 size={14} className="text-amber-300" />
          <span>{String(item.start_time).slice(0, 5)} – {String(item.end_time).slice(0, 5)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white">
          <MapPin size={14} className="text-amber-300" />
          <span>{item.location}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          disabled={pending}
          onClick={handleReject}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
        >
          <XCircle size={15} />
          <span>رفض وفك الموعد</span>
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={handleConfirm}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-black text-[#052117] shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          <span>{pending ? "جارٍ التأكيد..." : "تأكيد استلام الفلوس وتثبيت الحجز"}</span>
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
