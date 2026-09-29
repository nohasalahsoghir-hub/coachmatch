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
    <div className="surface shadow-xl">
      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
        <ShieldCheck size={16} />
        <span>المواعيد المعروضة متاحة ومحدثة لحظياً · ضمان استرداد فوري 100%</span>
      </div>

      {!availability.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--line)] p-7 text-center text-sm text-[var(--muted)]">
          لا توجد مواعيد متاحة خلال الفترة الحالية. يمكن اختيار مدرب آخر أو المتابعة لاحقًا.
        </div>
      ) : (
        <>
          {/* Day selection */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[var(--text)]">
              <CalendarDays size={14} className="text-[var(--cobalt)]" />
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
                      ? "border-[var(--cobalt)] bg-[var(--cobalt)] text-white shadow-md shadow-[var(--cobalt)]/25 font-black"
                      : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--cobalt)]/50"
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
            <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[var(--text)]">
              <Clock3 size={14} className="text-[var(--cobalt)]" />
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
                      ? "border-[var(--cobalt)] bg-[var(--cobalt)] text-white shadow-md shadow-[var(--cobalt)]/25"
                      : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cobalt)]/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Training location */}
          <label className="mt-5 block text-xs text-[var(--muted)]">
            مكان التدريب
            <select
              disabled={pending}
              value={location}
              onChange={(e) => chooseLocation(e.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none focus:border-[var(--cobalt)]"
            >
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          {/* Pricing Summary */}
          <div className="mt-5 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4 text-xs">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--muted)]">قيمة الجلسة التدريبية:</span>
              <b className="text-[var(--text)]">{sessionRate.toLocaleString("ar-EG")} ج.م</b>
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-[var(--muted-2)]">
              <span>رسوم التشغيل وحجز الموعد:</span>
              <span>10 ج.م</span>
            </div>
            <div className="mt-2 border-t border-[var(--line-soft)] pt-2 flex justify-between text-xs font-black text-amber-300">
              <span>الإجمالي المطلوب:</span>
              <span className="tabular font-black">{(sessionRate + 10).toLocaleString("ar-EG")} ج.م</span>
            </div>
            <p className="mt-2 text-[10px] text-[var(--muted-2)]">
              الدفع عبر انستاباي أو فودافون كاش وتأكيد الإيصال على واتساب · حجزك مؤمّن ومسترد بالكامل في حال إلغاء الجلسة.
            </p>
          </div>

          {/* Active package usage */}
          {packageId && packageRemaining > 0 && (
            <div className="mt-3 rounded-2xl border border-[var(--cobalt)]/30 bg-[var(--cobalt)]/10 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-[var(--cobalt)]">
                <Package size={15} />
                <span>لديك باقة تدريبية مفعلة</span>
              </div>
              <p className="mt-1 text-xs text-[var(--muted)]">
                متبقي لديك {packageRemaining} حصص. يمكنك حجز هذا الموعد مباشرة خصماً من الباقة.
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={usePackage}
                className="mt-3 min-h-11 w-full rounded-xl border border-[var(--cobalt)]/40 bg-[var(--cobalt)]/20 text-xs font-black text-white transition hover:bg-[var(--cobalt)]/30 disabled:opacity-50"
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
            className="btn-cobalt mt-5 min-h-13 w-full rounded-2xl text-sm font-black shadow-lg shadow-[var(--cobalt)]/20 transition-all disabled:opacity-50"
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
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--line)] text-xs font-bold text-[var(--muted)] transition hover:bg-white/5 disabled:opacity-50"
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
