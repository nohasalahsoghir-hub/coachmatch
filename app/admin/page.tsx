import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { PendingBookingCard, type PendingBookingItem } from "@/components/admin/PendingBookingCard";
import { AdminVerificationActions } from "@/components/admin/AdminVerificationActions";

export default async function AdminPage() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/admin");
  }

  const { data: profile } = await s
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const service = createServiceClient();

  // Run cleanup of expired holds automatically
  try {
    await service.rpc("cleanup_expired_pending_bookings");
  } catch {
    // Non-blocking cleanup
  }

  // Fetch pending manual bookings
  const { data: pendingRows } = await service
    .from("bookings")
    .select(`
      id,
      athlete_id,
      coach_id,
      session_date,
      start_time,
      end_time,
      location,
      total_amount,
      hold_expires_at,
      reference_code,
      created_at,
      athlete:profiles!bookings_athlete_id_fkey(full_name, phone)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Get coach info for these pending bookings
  const coachIds = [...new Set((pendingRows || []).map((b) => b.coach_id))];
  const { data: coachCatalog } = coachIds.length
    ? await service.from("coach_public_catalog").select("id, full_name, sports").in("id", coachIds)
    : { data: [] };

  const coachMap = new Map((coachCatalog || []).map((c) => [c.id, c]));

  const pendingBookings: PendingBookingItem[] = (pendingRows || []).map((b: any) => {
    const athlete = Array.isArray(b.athlete) ? b.athlete[0] : b.athlete;
    const coach = coachMap.get(b.coach_id);
    return {
      id: b.id,
      reference_code: b.reference_code || `CM-${b.id.slice(0, 6).toUpperCase()}`,
      athlete_name: athlete?.full_name || "متدرب",
      athlete_phone: athlete?.phone || "",
      coach_name: coach?.full_name || "المدرب",
      coach_sports: coach?.sports || [],
      session_date: String(b.session_date),
      start_time: String(b.start_time),
      end_time: String(b.end_time),
      location: b.location,
      total_amount: Number(b.total_amount || 0),
      hold_expires_at: b.hold_expires_at || "",
      created_at: b.created_at,
    };
  });

  // Fetch metrics & other admin sections
  const [
    { count: totalBookings },
    { count: confirmedBookings },
    { count: verifiedCoaches },
    { count: totalUsers },
    { data: verifications },
    { data: recentBookings },
  ] = await Promise.all([
    service.from("bookings").select("id", { count: "exact", head: true }),
    service.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    service.from("coaches").select("id", { count: "exact", head: true }).eq("is_verified", true),
    service.from("profiles").select("id", { count: "exact", head: true }),
    service
      .from("coach_verification_requests")
      .select("id, coach_id, status, submitted_at, documents")
      .in("status", ["pending", "needs_changes"])
      .order("submitted_at", { ascending: false })
      .limit(6),
    service
      .from("bookings")
      .select("id, athlete_id, coach_id, session_date, start_time, total_amount, status, created_at, reference_code")
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div className="space-y-8 pb-24">
      {/* Header Banner */}
      <section className="surface-raised p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cobalt)]/15 px-3 py-1 text-xs font-bold text-[var(--cobalt)]">
            <ShieldCheck size={14} />
            <span>لوحة تحكم المدير العام (Super Admin)</span>
          </span>
          <span className="text-xs text-[var(--muted)]">مرحباً، {profile.full_name} 👋</span>
        </div>

        <h1 className="mt-3 font-display text-2xl font-black text-[var(--text)] sm:text-3xl">
          مركز العمليات والتأكيد اليدوي
        </h1>
        <p className="mt-2 text-xs leading-6 text-[var(--muted)] sm:text-sm">
          تحقق من إيصالات التحويل المستلمة على WhatsApp، وأكّد أو الغِ الحجوزات بضغطة زر واحدة.
        </p>
      </section>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Clock3 className="text-amber-400" size={20} />}
          title="طلبات بانتظار الواتساب"
          value={pendingBookings.length}
          highlight={pendingBookings.length > 0}
        />
        <MetricCard
          icon={<CheckCircle2 className="text-emerald-400" size={20} />}
          title="حجوزات مؤكدة"
          value={confirmedBookings ?? 0}
        />
        <MetricCard
          icon={<Users className="text-sky-400" size={20} />}
          title="مدربين موثقين"
          value={verifiedCoaches ?? 0}
        />
        <MetricCard
          icon={<TrendingUp className="text-[var(--cobalt)]" size={20} />}
          title="إجمالي الحجوزات"
          value={totalBookings ?? 0}
        />
      </div>

      {/* HERO SECTION: Pending WhatsApp Bookings */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-black text-[var(--text)] flex items-center gap-2">
              <span>طلبات الحجز بانتظار تحويل الواتساب</span>
              {pendingBookings.length > 0 && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-black text-[#1a0800]">
                  {pendingBookings.length}
                </span>
              )}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              عند استلام إيصال التحويل (انستاباي / كاش) على واتساب، اضغط على زر "تأكيد" لتثبيت الموعد رسمياً.
            </p>
          </div>
        </div>

        {pendingBookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center">
            <CheckCircle2 size={40} className="mx-auto text-emerald-400/60" />
            <h3 className="mt-3 text-base font-bold text-[var(--text)]">لا توجد طلبات حجز معلقة حالياً</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              جميع الحجوزات تم تأكيدها أو لا توجد طلبات جديدة قيد الانتظار.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pendingBookings.map((item) => (
              <PendingBookingCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Coach Verifications & Recent Bookings */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification Requests */}
        <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-base font-black text-white">طلبات توثيق المدربين</h2>
            <span className="text-xs text-[#84988f]">{verifications?.length ?? 0} بانتظار المراجعة</span>
          </div>

          <div className="mt-4 space-y-3">
            {!verifications || verifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#71867c]">لا توجد طلبات توثيق جديدة.</p>
            ) : (
              verifications.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between rounded-2xl bg-[#07110e] p-3.5">
                  <div>
                    <div className="text-xs font-bold text-white">طلب توثيق حساب كابتن</div>
                    <div className="mt-0.5 text-[10px] text-[#84988f]">
                      تاريخ الطلب: {new Date(v.submitted_at).toLocaleDateString("ar-EG")}
                    </div>
                  </div>
                  <AdminVerificationActions requestId={v.id} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Confirmed Bookings */}
        <section className="surface p-6">
          <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-3">
            <h2 className="text-base font-black text-[var(--text)]">آخر الحجوزات المؤكدة</h2>
            <span className="text-xs text-[var(--muted)]">{recentBookings?.length ?? 0} عمليات مؤكدة</span>
          </div>

          <div className="mt-4 space-y-3">
            {!recentBookings || recentBookings.length === 0 ? (
              <p className="py-6 text-center text-xs text-[var(--muted-2)]">لا توجد حجوزات مؤكدة بعد.</p>
            ) : (
              recentBookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-3.5 text-xs">
                  <div>
                    <div className="font-mono font-bold text-[var(--text)]">
                      {b.reference_code || `CM-${b.id.slice(0, 6).toUpperCase()}`}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                      موعد الجلسة: {b.session_date} · {String(b.start_time).slice(0, 5)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-black text-emerald-400 tabular">
                      {Number(b.total_amount).toLocaleString("ar-EG")} ج.م
                    </div>
                    <span className="text-[10px] text-emerald-300 font-bold">مؤكد ✅</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 transition-all ${
        highlight
          ? "border-amber-400/30 bg-amber-400/5 shadow-lg shadow-amber-400/10"
          : "border-[var(--line)] bg-[var(--surface)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">{title}</span>
        {icon}
      </div>
      <div className="mt-3 font-display text-2xl font-black text-[var(--text)] tabular">{value}</div>
    </div>
  );
}
