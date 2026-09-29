import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  Clock,
  ExternalLink,
  Package,
  Settings,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BookingRow } from "@/components/coach/BookingRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { TraineeRosterHub, TraineeItem } from "@/components/coach/TraineeRosterHub";

export const metadata = {
  title: "لوحة تحكم وتحليلات المدرب | CoachMatch",
  description: "تحليلات الأداء المالي، معدل إشغال الجدول، وإدارة وتجديد اشتراكات المتدربين لكافة الرياضات.",
};

export default async function CoachDashboard() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) redirect("/auth/login");

  // Fetch coach profile, coach row, availability slots, packages, and bookings
  const [
    { data: profile },
    { data: coach },
    { data: availability },
    { data: athletePackages },
    { data: allBookings },
  ] = await Promise.all([
    s.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
    s
      .from("coaches")
      .select("id, accepting_bookings, rating, total_reviews, session_rate, package_8_rate, cv_url, sports, training_locations")
      .eq("id", user.id)
      .maybeSingle(),
    s
      .from("coach_availability")
      .select("id, day_of_week, start_time, end_time, is_active")
      .eq("coach_id", user.id),
    s
      .from("athlete_packages")
      .select("id, athlete_id, total_sessions, remaining_sessions, status, expires_at, created_at, athlete:profiles!athlete_packages_athlete_id_fkey(full_name, phone)")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false }),
    s
      .from("bookings")
      .select("id, session_date, start_time, end_time, location, status, athlete_id, coach_net, total_price, package_id, created_at, athlete:profiles!bookings_athlete_id_fkey(full_name, phone)")
      .eq("coach_id", user.id)
      .order("session_date", { ascending: false }),
  ]);

  if (!coach || profile?.role !== "coach") {
    redirect("/dashboard");
  }

  // Current Date Math
  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthPrefix = todayStr.slice(0, 7); // "YYYY-MM"

  // 1. Financial Pulse Metrics
  const totalEarnings = (allBookings ?? [])
    .filter((b: any) => b.status === "completed")
    .reduce((sum: number, b: any) => sum + Number(b.coach_net ?? 0), 0);

  const monthEarnings = (allBookings ?? [])
    .filter((b: any) => b.status === "completed" && b.session_date?.startsWith(currentMonthPrefix))
    .reduce((sum: number, b: any) => sum + Number(b.coach_net ?? 0), 0);

  const pendingEarnings = (allBookings ?? [])
    .filter((b: any) => b.status === "confirmed")
    .reduce((sum: number, b: any) => sum + Number(b.coach_net ?? 0), 0);

  // 2. Schedule Capacity & Utilization Rate
  const activeWeeklySlots = (availability ?? []).filter((a: any) => a.is_active).length;

  // Bookings this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  const startStr = startOfWeek.toISOString().split("T")[0];
  const endStr = endOfWeek.toISOString().split("T")[0];

  const thisWeekBookingsCount = (allBookings ?? []).filter(
    (b: any) =>
      (b.status === "confirmed" || b.status === "completed") &&
      b.session_date >= startStr &&
      b.session_date <= endStr
  ).length;

  const capacityPct =
    activeWeeklySlots > 0
      ? Math.min(100, Math.round((thisWeekBookingsCount / activeWeeklySlots) * 100))
      : 0;

  // 3. Trainee Lifecycle Roster Assembly
  const traineeMap = new Map<string, TraineeItem>();

  // A. Process athlete packages
  (athletePackages ?? []).forEach((pkg: any) => {
    const athlete = Array.isArray(pkg.athlete) ? pkg.athlete[0] : pkg.athlete;
    const athleteId = pkg.athlete_id;
    if (!athleteId) return;

    const existing = traineeMap.get(athleteId);
    if (!existing || Number(pkg.remaining_sessions || 0) > Number(existing.remainingSessions || 0)) {
      traineeMap.set(athleteId, {
        athleteId,
        athleteName: athlete?.full_name || existing?.athleteName || "متدرب",
        athletePhone: athlete?.phone || existing?.athletePhone || "",
        packageId: pkg.id,
        totalSessions: Number(pkg.total_sessions || 8),
        remainingSessions: Number(pkg.remaining_sessions || 0),
        packageStatus: pkg.status || "active",
        expiresAt: pkg.expires_at,
        lastSessionDate: existing?.lastSessionDate || null,
        nextSessionDate: existing?.nextSessionDate || null,
        totalBookingsCompleted: existing?.totalBookingsCompleted || 0,
      });
    }
  });

  // B. Process bookings to incorporate single session trainees & track session counts
  (allBookings ?? []).forEach((b: any) => {
    const athleteId = b.athlete_id;
    if (!athleteId) return;
    const athlete = Array.isArray(b.athlete) ? b.athlete[0] : b.athlete;

    let item = traineeMap.get(athleteId);
    if (!item) {
      item = {
        athleteId,
        athleteName: athlete?.full_name || "متدرب",
        athletePhone: athlete?.phone || "",
        packageId: null,
        totalSessions: 0,
        remainingSessions: 0,
        packageStatus: "none",
        expiresAt: null,
        lastSessionDate: null,
        nextSessionDate: null,
        totalBookingsCompleted: 0,
      };
      traineeMap.set(athleteId, item);
    }

    if (b.status === "completed") {
      item.totalBookingsCompleted += 1;
      if (!item.lastSessionDate || b.session_date > item.lastSessionDate) {
        item.lastSessionDate = b.session_date;
      }
    }

    if ((b.status === "confirmed" || b.status === "pending") && b.session_date >= todayStr) {
      if (!item.nextSessionDate || b.session_date < item.nextSessionDate) {
        item.nextSessionDate = b.session_date;
      }
    }
  });

  const traineesList = Array.from(traineeMap.values());

  // 4. Retention & Package Ratio
  const totalTraineesCount = traineesList.length;
  const packageTraineesCount = traineesList.filter(
    (t) => t.packageId && t.remainingSessions > 0
  ).length;
  const packageAdoptionPct =
    totalTraineesCount > 0
      ? Math.round((packageTraineesCount / totalTraineesCount) * 100)
      : 0;

  // 5. Coaching Quality & Show-up Rate
  const completedCount = (allBookings ?? []).filter((b: any) => b.status === "completed").length;
  const cancelledCount = (allBookings ?? []).filter((b: any) => b.status === "cancelled").length;
  const totalFinishedSessions = completedCount + cancelledCount;
  const showUpPct =
    totalFinishedSessions > 0
      ? Math.round((completedCount / totalFinishedSessions) * 100)
      : 100;

  // 6. Upcoming confirmed/pending sessions
  const upcomingBookings = (allBookings ?? [])
    .filter(
      (b: any) =>
        (b.status === "confirmed" || b.status === "pending") && b.session_date >= todayStr
    )
    .sort((a: any, b: any) => {
      if (a.session_date !== b.session_date) {
        return a.session_date.localeCompare(b.session_date);
      }
      return (a.start_time || "").localeCompare(b.start_time || "");
    })
    .slice(0, 8);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome & Quick Controls */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(62,111,242,0.12)] px-3 py-1 text-xs font-black text-cobalt-300">
                <Sparkles size={13} />
                لوحة تحليلات وإدارة المدرب
              </span>
              {coach.accepting_bookings ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  الحجوزات مفعلة وتستقبل متدربين
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  الحجوزات متوقفة مؤقتاً
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)]">
              أهلاً كابتن {profile?.full_name ?? "مدربنا"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-2xl leading-6">
              تابع مؤشرات أداء حصصك وأرباحك الصافية، راقب سعة جدولك الأسبوعي، وتحكم في دورة حياة المتدربين وتجديد باقاتهم بكل سهولة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/coaches/${user.id}`}
              target="_blank"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 text-xs font-bold text-[var(--text)] transition hover:border-[var(--cobalt)] hover:text-white"
            >
              <ExternalLink size={14} />
              <span>معاينة ملفك العام</span>
            </Link>
            <Link
              href="/coach/profile"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--cobalt)] px-5 text-xs font-black text-white shadow-lg shadow-[var(--cobalt)]/25 transition hover:bg-cobalt-400"
            >
              <Settings size={14} />
              <span>إدارة الأسعار والمواعيد والـ CV</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Option 1: 4-Card Performance Pulse Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-cobalt-300" />
            <h2 className="text-lg font-black text-[var(--text)]">مؤشرات الأداء والسعة</h2>
          </div>
          <span className="text-[11px] text-[var(--muted-2)] font-mono">محدثة لحظياً من قاعدة البيانات</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Net Financial Pulse */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-cobalt-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)]">صافي الأرباح المكتملة</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-cobalt-500/10 text-cobalt-300">
                <Wallet size={17} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-[var(--text)]">
              {totalEarnings.toLocaleString("ar-EG")} <span className="text-xs font-bold text-[var(--muted)]">ج.م</span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--line-soft)] text-[11px]">
              <span className="text-[var(--muted-2)]">أرباح هذا الشهر:</span>
              <span className="font-bold text-emerald-400 font-mono">
                +{monthEarnings.toLocaleString("ar-EG")} ج.م
              </span>
            </div>
            {pendingEarnings > 0 && (
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-[var(--muted-2)]">حجوزات قادمة مؤكدة:</span>
                <span className="font-bold text-cobalt-300 font-mono">
                  {pendingEarnings.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
            )}
          </div>

          {/* Card 2: Schedule Capacity & Utilization Rate */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-cobalt-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)]">إشغال الجدول هذا الأسبوع</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-cobalt-500/10 text-cobalt-300">
                <CalendarRange size={17} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-[var(--text)]">
              {activeWeeklySlots > 0 ? (
                <>
                  {capacityPct}%{" "}
                  <span className="text-xs font-bold text-[var(--muted)]">
                    ({thisWeekBookingsCount} من {activeWeeklySlots} موعد)
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-300">لم تحدد مواعيد بعد</span>
              )}
            </div>
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div
                  className="h-full rounded-full bg-[var(--cobalt)] transition-all duration-500"
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted-2)]">
                <span>السعة: {activeWeeklySlots} ساعة/أسبوع</span>
                <Link href="/coach/profile" className="text-cobalt-300 hover:underline">
                  ضبط المواعيد
                </Link>
              </div>
            </div>
          </div>

          {/* Card 3: Trainee Retention & Package Ratio */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-cobalt-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)]">ولاء المتدربين والباقات</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-cobalt-500/10 text-cobalt-300">
                <Package size={17} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-[var(--text)]">
              {packageAdoptionPct}%{" "}
              <span className="text-xs font-bold text-[var(--muted)]">مشتركون بباقات</span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--line-soft)] text-[11px]">
              <span className="text-[var(--muted-2)]">إجمالي المتدربين:</span>
              <span className="font-bold text-[var(--text)] font-mono">{totalTraineesCount} لاعب</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[var(--muted-2)]">باقات جارية فعالة:</span>
              <span className="font-bold text-cobalt-300 font-mono">{packageTraineesCount} باقة</span>
            </div>
          </div>

          {/* Card 4: Coaching Quality & Show-up Rate */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-cobalt-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)]">تقييم الجودة وإتمام الحصص</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-cobalt-500/10 text-cobalt-300">
                <Award size={17} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-[var(--text)]">
              {Number(coach.rating ?? 5.0).toFixed(1)}{" "}
              <span className="text-sm text-amber-400">★</span>{" "}
              <span className="text-xs font-bold text-[var(--muted)]">
                ({coach.total_reviews ?? 0} تقييم)
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--line-soft)] text-[11px]">
              <span className="text-[var(--muted-2)]">نسبة إتمام الحصص:</span>
              <span className="font-bold text-emerald-400 font-mono">{showUpPct}%</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[var(--muted-2)]">الحصص المنجزة:</span>
              <span className="font-bold text-[var(--text)] font-mono">{completedCount} جلسة</span>
            </div>
          </div>
        </div>
      </section>

      {/* Option 3: Trainee Lifecycle Hub & Rebooking/Renewal Alerts */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users size={19} className="text-cobalt-300" />
            <div>
              <h2 className="text-lg font-black text-[var(--text)]">
                مركز المتدربين ومتابعة التجديد الذكي
              </h2>
              <p className="text-xs text-[var(--muted)]">
                تتبع رصيد حصص كل متدرب، واستخدم زر واتساب المباشر لإعادة الحجز قبل نفاد الباقة.
              </p>
            </div>
          </div>
        </div>

        <TraineeRosterHub trainees={traineesList} />
      </section>

      {/* Upcoming Confirmed Bookings Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-cobalt-300" />
            <h2 className="text-lg font-black text-[var(--text)]">جدول الحصص القادمة</h2>
          </div>
          <span className="text-xs text-[var(--muted-2)]">
            {upcomingBookings.length} حصص مجدولة
          </span>
        </div>

        {upcomingBookings.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcomingBookings.map((b: any) => {
              const athlete = Array.isArray(b.athlete) ? b.athlete[0] : b.athlete;
              return (
                <BookingRow
                  key={b.id}
                  booking={{
                    id: b.id,
                    session_date: b.session_date,
                    start_time: String(b.start_time),
                    end_time: String(b.end_time),
                    location: b.location,
                    status: b.status,
                    athleteName: athlete?.full_name ?? "متدرب",
                    athletePhone: athlete?.phone ?? "",
                  }}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="لا توجد حجوزات قادمة مجدولة حالياً"
            text="تأكد من تفعيل استقبال الحجوزات وضبط أوقات فراغك وسعر الباقة في صفحة ملفك الشخصي لتظهر للباحثين عن مدربين."
            href="/coach/profile"
            label="إدارة الملف وضبط المواعيد"
          />
        )}
      </section>
    </div>
  );
}
