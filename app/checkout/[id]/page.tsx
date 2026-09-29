import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, MapPin, ShieldCheck, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { WhatsAppCheckoutActions } from "@/components/checkout/WhatsAppCheckoutActions";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=/checkout/${id}`);
  }

  // Fetch booking details
  const { data: booking, error } = await s
    .from("bookings")
    .select(`
      id,
      athlete_id,
      coach_id,
      session_date,
      start_time,
      end_time,
      location,
      status,
      payment_status,
      subtotal,
      checkout_fee,
      total_amount,
      hold_expires_at,
      reference_code
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !booking) {
    notFound();
  }

  // Verify ownership or admin permission
  const { data: profile } = await s
    .from("profiles")
    .select("role, full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (booking.athlete_id !== user.id && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch coach public profile
  const { data: coach } = await s
    .from("coach_public_catalog")
    .select("id, full_name, avatar_url, sports, headline")
    .eq("id", booking.coach_id)
    .maybeSingle();

  const refCode = booking.reference_code || `CM-${booking.id.slice(0, 6).toUpperCase()}`;

  // If already confirmed
  if (booking.status === "confirmed") {
    return (
      <div className="mx-auto max-w-xl py-8">
        <div className="surface p-8 text-center shadow-xl">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck size={36} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-[var(--text)]">هذا الحجز مؤكد رسمياً! ✅</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            تم تأكيد استلام الدفعة وتثبيت موعدك مع الكابتن {coach?.full_name || "المدرب"}.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="btn-cobalt inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black"
            >
              <span>الانتقال لجدول حجوزاتي</span>
              <ArrowLeft size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If cancelled
  if (booking.status === "cancelled") {
    return (
      <div className="mx-auto max-w-xl py-8">
        <div className="surface border-rose-500/20 p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-[var(--text)]">طلب الحجز ملغي</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            انتهت مهلة هذا الطلب أو تم إلغاؤه. يمكنك اختيار موعد جديد من صفحة المدرب في أي وقت.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href={`/coaches/${booking.coach_id}`}
              className="btn-ghost inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-[var(--text)]"
            >
              <span>العودة لجدول الكابتن</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const whatsappDetails = {
    referenceCode: refCode,
    athleteName: profile?.full_name || "متدرب",
    athletePhone: profile?.phone || "",
    coachName: coach?.full_name || "الكابتن",
    sports: coach?.sports || [],
    sessionDate: String(booking.session_date),
    startTime: String(booking.start_time).slice(0, 5),
    endTime: String(booking.end_time).slice(0, 5),
    location: booking.location,
    totalAmount: Number(booking.total_amount || 0),
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-20">
      {/* Back Link */}
      <Link
        href={`/coaches/${booking.coach_id}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] transition hover:text-white"
      >
        <ArrowRight size={14} />
        <span>العودة لصفحة الكابتن</span>
      </Link>

      {/* Hero Header with Customer Protection */}
      <header className="surface-raised p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cobalt)]/15 px-3 py-1 text-xs font-bold text-[var(--cobalt)]">
            <ShieldCheck size={14} />
            <span>حجزك مؤمّن بالكامل · ضمان استرداد فوري 100%</span>
          </span>
          <span className="font-mono text-xs font-bold text-[var(--muted)]">
            رقم الطلب: <strong className="text-[var(--text)]">{refCode}</strong>
          </span>
        </div>

        <h1 className="mt-4 font-display text-2xl font-black text-[var(--text)] sm:text-3xl">
          تم حجز الموعد مؤقتاً لحسابك!
        </h1>
        <p className="mt-2 text-xs leading-6 text-[var(--muted)] sm:text-sm">
          حوّل المبلغ المطلوب عبر <strong>انستاباي</strong> أو <strong>فودافون كاش</strong> بأريحية تامة، ثم أرسل الإيصال عبر WhatsApp ليؤكد فريق المنصة موعدك مباشرة.
        </p>

        {/* 3-Step Visual Progress Stepper */}
        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-[var(--line-soft)] pt-5 text-center text-[11px] font-bold">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            <div>1. اختيار الموعد</div>
            <div className="text-[10px] font-normal opacity-80">تم بنجاح ✓</div>
          </div>
          <div className="rounded-xl border border-[var(--cobalt)] bg-[var(--cobalt)]/15 p-2 text-[var(--cobalt)] font-black">
            <div>2. تحويل المبلغ</div>
            <div className="text-[10px] font-normal opacity-90">الخطوة الحالية ⏳</div>
          </div>
          <div className="rounded-xl bg-[var(--surface-3)]/30 p-2 text-[var(--muted-2)]">
            <div>3. تثبيت الكابتن</div>
            <div className="text-[10px] font-normal opacity-70">فور وصول الإيصال 🔒</div>
          </div>
        </div>
      </header>

      {/* Booking Details Card */}
      <section className="surface p-6">
        <div className="flex items-center gap-4">
          {coach?.avatar_url ? (
            <img
              src={coach.avatar_url}
              alt={coach.full_name}
              className="h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface-3)] text-xl font-black text-[var(--cobalt)]">
              <User size={24} />
            </div>
          )}
          <div>
            <h2 className="text-lg font-black text-[var(--text)]">{coach?.full_name || "كابتن تدريب"}</h2>
            <p className="text-xs text-[var(--muted)]">
              {(coach?.sports || []).join(" · ") || "جلسة تدريب فردية"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <InfoItem
            icon={<CalendarDays size={16} />}
            label="تاريخ الجلسة"
            value={String(booking.session_date)}
          />
          <InfoItem
            icon={<Clock3 size={16} />}
            label="الوقت"
            value={`${String(booking.start_time).slice(0, 5)} – ${String(booking.end_time).slice(0, 5)}`}
          />
          <InfoItem
            icon={<MapPin size={16} />}
            label="المكان"
            value={booking.location}
          />
        </div>

        {/* Pricing Breakdown */}
        <div className="mt-6 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4 text-xs space-y-2">
          <div className="flex justify-between text-[var(--muted)]">
            <span>سعر الجلسة التدريبية:</span>
            <span className="font-bold text-[var(--text)]">{Number(booking.subtotal || 0).toLocaleString("ar-EG")} ج.م</span>
          </div>
          <div className="flex justify-between text-[var(--muted)]">
            <span>رسوم التشغيل وحجز الموعد:</span>
            <span className="font-bold text-[var(--text)]">{Number(booking.checkout_fee || 10).toLocaleString("ar-EG")} ج.م</span>
          </div>
          <div className="border-t border-[var(--line-soft)] pt-2 flex justify-between text-sm font-black text-[var(--text)]">
            <span>الإجمالي المطلوب تحويله:</span>
            <span className="font-display text-base text-amber-300 tabular font-black">
              {Number(booking.total_amount || 0).toLocaleString("ar-EG")} ج.م
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Actions (InstaPay/Vodafone copy + WhatsApp Button + "I have paid" toggle) */}
      <WhatsAppCheckoutActions
        details={whatsappDetails}
        holdExpiresAt={booking.hold_expires_at || undefined}
        instapayHandle="coachmatch@instapay"
        vodafoneCashNumber="01100229462"
      />
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-2)]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-xs font-bold text-[var(--text)] truncate">{value}</div>
    </div>
  );
}
