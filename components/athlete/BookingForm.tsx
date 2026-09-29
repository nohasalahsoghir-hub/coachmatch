"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3, MapPin, Package, ShieldCheck, ArrowLeft } from "lucide-react";
import { bookWithPackage, createManualBookingIntent } from "@/lib/actions/bookings";
import { activatePackage } from "@/lib/actions/packages";
import type { AvailabilityDay } from "@/lib/marketplace";

interface Props {
  coachId: string;
  sessionRate: number;
  packageRate: number;
  locations: string[];
  availability: AvailabilityDay[];
  packageId?: string | null;
  packageRemaining?: number;
}

export function BookingForm({
  coachId,
  sessionRate,
  packageRate,
  locations,
  availability,
  packageId = null,
  packageRemaining = 0,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [date, setDate] = useState(availability[0]?.date ?? "");
  const [time, setTime] = useState(availability[0]?.slots[0] ?? "");
  const [location, setLocation] = useState(locations[0] ?? "");
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => availability.find((x) => x.date === date), [availability, date]);

  const chooseDate = (d: string) => {
    setDate(d);
    setTime(availability.find((x) => x.date === d)?.slots[0] ?? "");
    setError(null);
  };

  const chooseTime = (t: string) => {
    setTime(t);
    setError(null);
  };

  const chooseLocation = (l: string) => {
    setLocation(l);
    setError(null);
  };

  const bookManual = () => {
    setError(null);
    if (!date || !time || !location) {
      setError("يرجى اختيار اليوم والموعد والمكان أولاً.");
      return;
    }
    start(async () => {
      try {
        const res = await createManualBookingIntent({
          coachId,
          sessionDate: date,
          startTime: time,
          location,
        });
        router.push(`/checkout/${res.booking_id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر إنشاء طلب الحجز. يرجى اختيار موعد آخر.");
      }
    });
  };

  const usePackage = () => {
    setError(null);
    if (!packageId || !date || !time || !location) {
      setError("يرجى اختيار اليوم والموعد والمكان.");
      return;
    }
    start(async () => {
      try {
        await bookWithPackage({ packageId, coachId, sessionDate: date, startTime: time, location });
        router.push("/dashboard?packageBooking=success");
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر استخدام الحصة من الباقة.");
      }
    });
  };

  const enablePackage = () =>
    start(async () => {
      setError(null);
      try {
        await activatePackage(coachId);
        router.push("/dashboard?package=activated");
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر تفعيل الباقة التجريبية.");
      }
    });

  return (
    <div className="rounded-[2.5rem] border border-white/10 bg-[var(--surface)] p-6 shadow-xl">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
        <ShieldCheck size={16} />
        <span>المواعيد المعروضة متاحة ومحدثة لحظياً</span>
      </div>

      {!availability.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-[#73877e]">
          لا توجد مواعيد متاحة خلال الفترة الحالية. يمكن اختيار مدرب آخر أو المتابعة لاحقًا.
        </div>
      ) : (
        <>
          {/* Day selection */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#b3c0bb]">
              <CalendarDays size={14} />
              <span>اختيار اليوم</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {availability.slice(0, 7).map((d) => (
                <button
                  key={d.date}
                  type="button"
                  disabled={pending}
                  onClick={() => chooseDate(d.date)}
                  className={`min-h-16 min-w-28 rounded-2xl border px-3 text-right transition-all ${
                    date === d.date
                      ? "border-[var(--flare)] bg-[var(--flare)] text-[#1a0800] shadow-md shadow-[var(--flare)]/20 font-black"
                      : "border-white/7 bg-[#07110e] text-[#84988f] hover:border-white/20"
                  }`}
                >
                  <div className="text-xs font-extrabold">{d.label}</div>
                  <div className="mt-1 text-[10px] opacity-75">{d.slots.length} مواعيد</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time slot selection */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#b3c0bb]">
              <Clock3 size={14} />
              <span>اختيار الموعد</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {selected?.slots.map((s) => (
                <button
                  type="button"
                  disabled={pending}
                  key={s}
                  onClick={() => chooseTime(s)}
                  className={`min-h-11 rounded-xl border text-xs font-black transition-all ${
                    time === s
                      ? "border-[var(--flare)] bg-[var(--flare)] text-[#1a0800] shadow-md shadow-[var(--flare)]/20"
                      : "border-white/7 bg-[#07110e] text-[#91a49b] hover:border-white/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Training location */}
          <label className="mt-5 block text-xs text-[#82968d]">
            مكان التدريب
            <select
              disabled={pending}
              value={location}
              onChange={(e) => chooseLocation(e.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-white/8 bg-[#07110e] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--flare)]"
            >
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          {/* Pricing Summary */}
          <div className="mt-5 rounded-2xl bg-[#07110e] p-4 text-xs">
            <div className="flex justify-between text-sm">
              <span className="text-[#84988f]">قيمة الجلسة التدريبية:</span>
              <b className="text-white">{sessionRate.toLocaleString("ar-EG")} ج.م</b>
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-[#71867c]">
              <span>رسوم التشغيل وحجز الموعد:</span>
              <span>10 ج.م</span>
            </div>
            <div className="mt-2 border-t border-white/5 pt-2 flex justify-between text-xs font-black text-amber-300">
              <span>الإجمالي المطلوب:</span>
              <span>{(sessionRate + 10).toLocaleString("ar-EG")} ج.م</span>
            </div>
            <p className="mt-2 text-[10px] text-[#60756b]">
              الدفع يتم عبر تحويل بنكي / انستاباي / فودافون كاش وتأكيد الإيصال على واتساب.
            </p>
          </div>

          {/* Active package usage */}
          {packageId && packageRemaining > 0 && (
            <div className="mt-3 rounded-2xl border border-[var(--flare)]/20 bg-[var(--flare)]/5 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-[var(--flare)]">
                <Package size={15} />
                <span>لديك باقة تدريبية مفعلة</span>
              </div>
              <p className="mt-1 text-xs text-[#8aa098]">
                متبقي لديك {packageRemaining} حصص. يمكنك حجز هذا الموعد مباشرة خصماً من الباقة.
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={usePackage}
                className="mt-3 min-h-11 w-full rounded-xl border border-[var(--flare)]/30 bg-[var(--flare)]/15 text-xs font-black text-[var(--flare)] transition hover:bg-[var(--flare)]/25 disabled:opacity-50"
              >
                استخدام حصة من الباقة بدون تحويل جديد
              </button>
            </div>
          )}

          {/* Primary Action Button: Proceed to WhatsApp Payment */}
          <button
            type="button"
            disabled={pending || !date || !time || !location}
            onClick={bookManual}
            className="btn-flare mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black shadow-lg shadow-[var(--flare)]/25 transition-all disabled:opacity-50"
          >
            <span>{pending ? "جارٍ تسجيل طلب الحجز..." : "المتابعة لحجز الموعد والدفع عبر WhatsApp"}</span>
            <ArrowLeft size={16} />
          </button>

          {/* Free Trial Package (if eligible) */}
          {packageRate > 0 && !packageId && (
            <button
              type="button"
              disabled={pending}
              onClick={enablePackage}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-bold text-[#84988f] transition hover:bg-white/5 disabled:opacity-50"
            >
              <Package size={14} />
              <span>تفعيل باقة تجريبية مجانية (8 حصص)</span>
            </button>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
