import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPin, ShieldCheck, User } from "lucide-react";
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
        <div className="rounded-[2.5rem] border border-emerald-500/20 bg-[var(--surface)] p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck size={36} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">هذا الحجز مؤكد رسمياً! ✅</h1>
          <p className="mt-2 text-sm text-[#84988f]">
            تم تأكيد استلام الدفعة وتثبيت موعدك مع الكابتن {coach?.full_name || "المدرب"}.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="btn-flare inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black"
            >
              <span>الانتقال لجدول حجوزاتي</span>
              <ArrowRight size={16} />
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
        <div className="rounded-[2.5rem] border border-rose-500/20 bg-[var(--surface)] p-8 text-center">
          <h1 className="text-2xl font-black text-white">طلب الحجز ملغي</h1>
          <p className="mt-2 text-sm text-[#84988f]">
            انتهت مهلة هذا الطلب أو تم إلغاؤه. يمكنك اختيار موعد جديد من صفحة المدرب.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href={`/coaches/${booking.coach_id}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20"
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
        className="inline-flex items-center gap-2 text-xs font-bold text-[#84988f] transition hover:text-white"
      >
        <ArrowRight size={14} />
        <span>العودة لصفحة الكابتن</span>
      </Link>

      {/* Hero Header */}
      <header className="rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#1A2821] to-[#0D1512] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-[11px] font-bold text-amber-300">
            <Clock3 size={13} />
            <span>بانتظار التحويل وتأكيد الواتساب</span>
          </span>
          <span className="font-mono text-xs font-bold text-[#84988f]">
            رقم الطلب: <strong className="text-white">{refCode}</strong>
          </span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-black text-white sm:text-3xl">
          خطوة واحدة ويكون موعدك مؤكداً!
        </h1>
        <p className="mt-2 text-xs leading-6 text-[#9ab0a7] sm:text-sm">
          حوّل المبلغ المطلوب عبر <strong>انستاباي</strong> أو <strong>فودافون كاش</strong>، ثم اضغط على زر الواتساب بالأسفل لإرسال الإيصال وتثبيت الموعد فوراً.
        </p>
      </header>

      {/* Booking Details Card */}
      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6">
        <div className="flex items-center gap-4">
          {coach?.avatar_url ? (
            <img
              src={coach.avatar_url}
              alt={coach.full_name}
              className="h-14 w-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-xl font-black text-amber-400">
              <User size={24} />
            </div>
          )}
          <div>
            <h2 className="text-lg font-black text-white">{coach?.full_name || "كابتن تدريب"}</h2>
            <p className="text-xs text-[#81968c]">
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
        <div className="mt-6 rounded-2xl bg-[#07110e] p-4 text-xs space-y-2">
          <div className="flex justify-between text-[#84988f]">
            <span>سعر الجلسة التدريبية:</span>
            <span className="font-bold text-white">{Number(booking.subtotal || 0).toLocaleString("ar-EG")} ج.م</span>
          </div>
          <div className="flex justify-between text-[#84988f]">
            <span>رسوم التشغيل وحجز الموعد:</span>
            <span className="font-bold text-white">{Number(booking.checkout_fee || 10).toLocaleString("ar-EG")} ج.م</span>
          </div>
          <div className="border-t border-white/5 pt-2 flex justify-between text-sm font-black text-white">
            <span>الإجمالي المطلوب تحويله:</span>
            <span className="font-display text-base text-amber-300">
              {Number(booking.total_amount || 0).toLocaleString("ar-EG")} ج.م
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Actions (InstaPay/Vodafone copy + WhatsApp Button) */}
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
    <div className="rounded-2xl border border-white/6 bg-[#07110e] p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] text-[#71867c]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-xs font-bold text-white truncate">{value}</div>
    </div>
  );
}
