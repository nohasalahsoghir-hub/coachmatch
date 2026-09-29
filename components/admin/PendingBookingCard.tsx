"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Clock3, MessageCircle, MapPin, CalendarDays, AlertTriangle } from "lucide-react";
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

  // Inline action modes to eliminate window.prompt and window.confirm
  const [actionMode, setActionMode] = useState<"none" | "confirming" | "rejecting">("none");
  const [paymentMethod, setPaymentMethod] = useState<string>("instapay");
  const [refNote, setRefNote] = useState<string>(item.reference_code);
  const [rejectReason, setRejectReason] = useState<string>("لم يتم استلام تحويل المبلغ عبر واتساب");

  const cleanPhone = (item.athlete_phone || "").replace(/\D/g, "");
  const athleteWaPhone = cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone;
  const athleteWaLink = athleteWaPhone ? `https://wa.me/${athleteWaPhone}` : null;

  const executeConfirm = () => {
    setError(null);
    start(async () => {
      try {
        await adminConfirmManualBooking(item.id, paymentMethod, refNote);
        setSuccess("تم تأكيد استلام المبلغ وتثبيت الحجز بنجاح! ✅");
        setActionMode("none");
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر تأكيد الحجز");
      }
    });
  };

  const executeReject = () => {
    setError(null);
    start(async () => {
      try {
        await adminRejectManualBooking(item.id, rejectReason);
        setSuccess("تم إلغاء الطلب وفك الموعد في جدول الكابتن فوراً. ❌");
        setActionMode("none");
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر إلغاء الطلب");
      }
    });
  };

  if (success) {
    return (
      <div className="surface border-emerald-500/30 bg-emerald-500/10 p-5 text-sm font-bold text-emerald-300">
        {success}
      </div>
    );
  }

  return (
    <div className="surface p-5 shadow-lg transition-all hover:border-[var(--cobalt)]/40">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line-soft)] pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-black text-amber-300 bg-amber-400/10 px-3 py-1 rounded-xl">
            {item.reference_code || `CM-${item.id.slice(0, 6).toUpperCase()}`}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)]">
            <Clock3 size={13} />
            <span>طلب معلق</span>
          </span>
        </div>
        <div className="font-display text-base font-black text-[var(--text)] tabular">
          {Number(item.total_amount).toLocaleString("ar-EG")} ج.م
        </div>
      </div>

      {/* Parties Info */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* Athlete */}
        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--muted-2)]">المتدرب (اللاعب):</span>
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
          <div className="mt-1 font-bold text-[var(--text)] text-sm">{item.athlete_name}</div>
          <div className="mt-0.5 text-[11px] text-[var(--muted)]">{item.athlete_phone || "بدون رقم هاتف"}</div>
        </div>

        {/* Coach */}
        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs">
          <span className="text-[10px] text-[var(--muted-2)]">الكابتن (المدرب):</span>
          <div className="mt-1 font-bold text-[var(--text)] text-sm">{item.coach_name}</div>
          <div className="mt-0.5 text-[11px] text-[var(--muted)]">
            {(item.coach_sports || []).join(" · ") || "رياضة"}
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="mt-3 flex flex-wrap gap-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
        <div className="flex items-center gap-1.5 text-[var(--text)]">
          <CalendarDays size={14} className="text-[var(--cobalt)]" />
          <span>{item.session_date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text)]">
          <Clock3 size={14} className="text-[var(--cobalt)]" />
          <span>{String(item.start_time).slice(0, 5)} – {String(item.end_time).slice(0, 5)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text)]">
          <MapPin size={14} className="text-[var(--cobalt)]" />
          <span>{item.location}</span>
        </div>
      </div>

      {/* Inline Action Triggers or Forms */}
      {actionMode === "none" ? (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => setActionMode("rejecting")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
          >
            <XCircle size={15} />
            <span>رفض وإلغاء الطلب</span>
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={() => setActionMode("confirming")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-black text-[#052117] shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            <span>تأكيد استلام الفلوس وتثبيت الحجز</span>
          </button>
        </div>
      ) : actionMode === "confirming" ? (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
            <CheckCircle2 size={16} />
            <span>تأكيد مطابقة الحوالة وتثبيت الحجز</span>
          </div>

          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <label className="text-[11px] text-[var(--muted)]">وسيلة الاستلام:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs text-[var(--text)] outline-none"
              >
                <option value="instapay">انستاباي (InstaPay)</option>
                <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[var(--muted)]">كود العملية / رقم الإيصال:</label>
              <input
                type="text"
                value={refNote}
                onChange={(e) => setRefNote(e.target.value)}
                placeholder="رقم مرجع الحوالة البنكية"
                className="mt-1 min-h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs text-[var(--text)] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => setActionMode("none")}
              className="min-h-9 rounded-xl border border-[var(--line)] px-3 text-xs font-bold text-[var(--muted)] hover:bg-white/5"
            >
              تراجع
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={executeConfirm}
              className="min-h-9 rounded-xl bg-emerald-500 px-4 text-xs font-black text-[#052117] hover:bg-emerald-400"
            >
              {pending ? "جارٍ التثبيت..." : "تأكيد نهائي وتثبيت الحجز"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-rose-300">
            <AlertTriangle size={16} />
            <span>تأكيد رفض الطلب وفك الموعد في جدول الكابتن</span>
          </div>

          <div>
            <label className="text-[11px] text-[var(--muted)]">سبب الإلغاء (سيظهر في إشعار المتدرب):</label>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 text-xs text-[var(--text)] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => setActionMode("none")}
              className="min-h-9 rounded-xl border border-[var(--line)] px-3 text-xs font-bold text-[var(--muted)] hover:bg-white/5"
            >
              تراجع
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={executeReject}
              className="min-h-9 rounded-xl bg-rose-500 px-4 text-xs font-black text-white hover:bg-rose-600"
            >
              {pending ? "جارٍ الإلغاء..." : "تأكيد الإلغاء وفك الموعد"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
