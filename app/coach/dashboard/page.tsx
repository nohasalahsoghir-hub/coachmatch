import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Award,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Clock,
  CreditCard,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  Settings,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BookingRow, formatWhatsAppNumber, isSessionPastEndTime } from "@/components/coach/BookingRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { TraineeRosterHub, TraineeItem } from "@/components/coach/TraineeRosterHub";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmAttendanceButton } from "@/components/coach/ConfirmAttendanceButton";

export const metadata = {
  title: "لوحة تحكم وتحليلات المدرب | CoachMatch",
  description: "تحليلات الأداء المالي، إدارة جدول الحصص اليومي، وتتبع دورة حياة المتدربين وتجديد الباقات.",
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
      .select("id, accepting_bookings, rating, total_reviews, session_rate, package_8_rate, cv_url, sports, training_locations, is_verified, instapay_address")
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
      .select("id, session_date, start_time, end_time, location, status, athlete_id, coach_net, total_price, total_amount, package_id, created_at, reference_code, athlete:profiles!bookings_athlete_id_fkey(full_name, phone)")
      .eq("coach_id", user.id)
      .order("session_date", { ascending: false }),
  ]);

  // Prevent infinite redirect loop: if role is not coach go to athlete dashboard, but if coach record missing go to profile setup
  if (profile?.role !== "coach") {
    redirect("/dashboard");
  }
  if (!coach) {
    redirect("/coach/profile");
  }

  // Cairo Time Math (Africa/Cairo)
  const cairoFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const [todayStr, nowTimeStr] = cairoFormatter.format(new Date()).split(", ");
  const currentMonthPrefix = todayStr.slice(0, 7); // "YYYY-MM"
  const currentTimeShort = nowTimeStr.slice(0, 5); // "HH:MM"

  // 1. Separate Bookings into Pending Completion (Past) vs Upcoming
  const bookingsList = allBookings ?? [];

  // Bookings that finished their scheduled time but haven't been completed yet
  const pendingCompletionBookings = bookingsList
    .filter((b: any) => {
      if (b.status !== "confirmed") return false;
      const bDate = b.session_date;
      const bEnd = String(b.end_time || "").slice(0, 5);
      if (bDate < todayStr) return true;
      if (bDate === todayStr && bEnd <= currentTimeShort) return true;
      return false;
    })
    .sort((a: any, b: any) => a.session_date.localeCompare(b.session_date));

  // Upcoming confirmed or pending bookings (today in the future, or upcoming days)
  const upcomingBookings = bookingsList
    .filter((b: any) => {
      if (b.status !== "confirmed" && b.status !== "pending") return false;
      const bDate = b.session_date;
      const bEnd = String(b.end_time || "").slice(0, 5);
      if (bDate > todayStr) return true;
      if (bDate === todayStr && bEnd > currentTimeShort) return true;
      return false;
    })
    .sort((a: any, b: any) => {
      if (a.session_date !== b.session_date) {
        return a.session_date.localeCompare(b.session_date);
      }
      return (a.start_time || "").localeCompare(b.start_time || "");
    });

  // Next immediate session
  const nextSession = upcomingBookings[0] || null;

  // 2. Financial Pulse Metrics
  const totalEarnings = bookingsList
    .filter((b: any) => b.status === "completed")
    .reduce((sum: number, b: any) => sum + Number(b.coach_net ?? 0), 0);

  const monthEarnings = bookingsList
    .filter((b: any) => b.status === "completed" && b.session_date?.startsWith(currentMonthPrefix))
    .reduce((sum: number, b: any) => sum + Number(b.coach_net ?? 0), 0);

  const pendingEarnings = bookingsList
    .filter((b: any) => b.status === "confirmed")
    .reduce((sum: number, b: any) => sum + Number(b.coach_net ?? 0), 0);

  // 3. Accurate Schedule Capacity Math (Real Available Hours)
  const activeSlots = (availability ?? []).filter((a: any) => a.is_active);
  const totalWeeklyCapacityHours = activeSlots.reduce((sum: number, a: any) => {
    const startH = parseInt(String(a.start_time).split(":")[0], 10);
    const endH = parseInt(String(a.end_time).split(":")[0], 10);
    const diff = isNaN(endH) || isNaN(startH) ? 1 : Math.max(1, endH - startH);
    return sum + diff;
  }, 0);

  // Calculate current week date boundary (Sunday through Saturday in Cairo)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startStr = startOfWeek.toISOString().split("T")[0];
  const endStr = endOfWeek.toISOString().split("T")[0];

  const thisWeekBookingsCount = bookingsList.filter(
    (b: any) =>
      (b.status === "confirmed" || b.status === "completed") &&
      b.session_date >= startStr &&
      b.session_date <= endStr
  ).length;

  const capacityPct =
    totalWeeklyCapacityHours > 0
      ? Math.min(100, Math.round((thisWeekBookingsCount / totalWeeklyCapacityHours) * 100))
      : 0;

  // 4. Trainee Lifecycle Roster Assembly
  const traineeMap = new Map<string, TraineeItem>();

  // A. Process athlete packages
  (athletePackages ?? []).forEach((pkg: any) => {
    const athlete = Array.isArray(pkg.athlete) ? pkg.athlete[0] : pkg.athlete;
    const athleteId = pkg.athlete_id;
    if (!athleteId) return;

    const existing = traineeMap.get(athleteId);
    if (!existing || Number(pkg.remaining_sessions || 0) >= Number(existing.remainingSessions || 0)) {
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

  // B. Process bookings to include single-session athletes & session counters
  bookingsList.forEach((b: any) => {
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

  // 5. Retention & Package Ratio
  const totalTraineesCount = traineesList.length;
  const packageTraineesCount = traineesList.filter(
    (t) => t.packageId && t.remainingSessions > 0
  ).length;
  const packageAdoptionPct =
    totalTraineesCount > 0
      ? Math.round((packageTraineesCount / totalTraineesCount) * 100)
      : 0;

  // 6. Coaching Quality & Completed Session Metrics
  const completedCount = bookingsList.filter((b: any) => b.status === "completed").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Verification Warning Alert if coach not approved yet */}
      {!coach.is_verified && (
        <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/20 text-amber-300">
                <ShieldAlert size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-amber-200">
                  حسابك قيد المراجعة والتوثيق من إدارة CoachMatch
                </h3>
                <p className="text-xs text-amber-100/80 leading-5">
                  ملفك الشخصي وجدول مواعيدك لن يظهرا في نتائج البحث العامة حتى يتم اعتماد شهاداتك وسيرتك الذاتية من الإدارة.
                </p>
              </div>
            </div>
            <Link
              href="/coach/profile"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-4 text-xs font-black text-black shadow-md shadow-amber-400/20 transition hover:bg-amber-300 shrink-0 active:scale-[0.98]"
            >
              <span>استكمال الملف والـ CV</span>
            </Link>
          </div>
        </section>
      )}

      {/* Missing InstaPay Alert */}
      {!coach.instapay_address?.trim() && (
        <section className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-500/20 text-blue-300">
                <CreditCard size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-blue-200">
                  تنبيه مالي: لم تقم بإضافة حساب إنستاباي لتسوية مستحقاتك
                </h3>
                <p className="text-xs text-blue-100/80 leading-5">
                  أضف عنوان إنستاباي (InstaPay Address) أو رقم فودافون كاش في صفحة ملفك لتحويل أرباح حصصك المكتملة دون تأخير.
                </p>
              </div>
            </div>
            <Link
              href="/coach/profile"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-4 text-xs font-black text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-400 shrink-0 active:scale-[0.98]"
            >
              <span>إضافة حساب التسوية</span>
            </Link>
          </div>
        </section>
      )}

      {/* Hero Welcome & Quick Controls */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(62,111,242,0.12)] px-3 py-1 text-xs font-black text-cobalt-300">
                <Sparkles size={13} />
                لوحة تحليلات وإدارة المدرب
              </span>
              {coach.is_verified ? (
                coach.accepting_bookings ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    الحجوزات مفعلة وتستقبل متدربين
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    الحجوزات متوقفة مؤقتاً
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                  قيد الاعتماد من الإدارة
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)]">
              أهلاً كابتن {profile?.full_name ?? "مدربنا"} 👋
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] max-w-2xl leading-6">
              تابع جدول حصصك اليومية، سجّل حضور جلساتك المنتهية لتحصيل أرباحك، ونسق مع متدربيك لتجديد باقاتهم بكل سهولة.
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
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--cobalt)] px-5 text-xs font-black text-white shadow-lg shadow-[var(--cobalt)]/25 transition hover:bg-cobalt-400 active:scale-[0.98]"
            >
              <Settings size={14} />
              <span>إدارة الأسعار والمواعيد والـ CV</span>
            </Link>
          </div>
        </div>
      </section>

      {/* PRIORITY 1: Next Immediate Session Spotlight Card */}
      {nextSession && (() => {
        const athlete = Array.isArray(nextSession.athlete) ? nextSession.athlete[0] : nextSession.athlete;
        const isToday = nextSession.session_date === todayStr;
        const waNum = formatWhatsAppNumber(athlete?.phone);
        const waLink = waNum
          ? `https://wa.me/${waNum}?text=${encodeURIComponent(
              `أهلاً يا ${athlete?.full_name || "متدربنا"} 👋 بخصوص تمريننا القادم يوم ${nextSession.session_date} الساعة ${String(nextSession.start_time).slice(0, 5)}...`
            )}`
          : "";

        return (
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--cobalt)]/40 bg-gradient-to-r from-[rgba(62,111,242,0.12)] to-[var(--surface)] p-6 sm:p-7 shadow-xl shadow-[var(--cobalt)]/5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--cobalt)] px-3 py-1 text-xs font-black text-white">
                    <Clock size={13} />
                    {isToday ? "جلستك القادمة اليوم ⚡" : "جلستك القادمة"}
                  </span>
                  <StatusBadge status={nextSession.status} />
                  {nextSession.reference_code && (
                    <span className="rounded-lg bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-mono text-cobalt-300 border border-[var(--line-soft)]">
                      كود: {nextSession.reference_code}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--text)]">
                    تمرين مع {athlete?.full_name ?? "متدرب"}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1.5 font-bold text-cobalt-300 font-mono">
                      <CalendarDays size={15} />
                      {nextSession.session_date}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono">
                      <Clock size={15} className="text-[var(--muted-2)]" />
                      {String(nextSession.start_time).slice(0, 5)} – {String(nextSession.end_time).slice(0, 5)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={15} className="text-[var(--muted-2)]" />
                      {nextSession.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                    title="مراسلة المتدرب على واتساب"
                  >
                    <MessageCircle size={16} />
                    <span>تواصل عبر واتساب</span>
                  </a>
                )}
                {nextSession.status === "confirmed" && (
                  <ConfirmAttendanceButton
                    bookingId={nextSession.id}
                    isPastSession={isSessionPastEndTime(nextSession.session_date, nextSession.end_time)}
                    endTimeLabel={String(nextSession.end_time).slice(0, 5)}
                  />
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* PRIORITY 2: Unconfirmed Past Sessions (Crucial Safety Net) */}
      {pendingCompletionBookings.length > 0 && (
        <section className="space-y-3 rounded-[2.5rem] border border-amber-400/40 bg-amber-400/5 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-400/20 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/20 text-amber-300">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-amber-200">
                  حصص منتهية بانتظار تأكيدك ({pendingCompletionBookings.length})
                </h3>
                <p className="text-xs text-amber-100/75">
                  انتهى موعد هذه الحصص، يرجى تأكيد حضور المتدرب لتسجيل أرباحك في المحفظة وإتاحة التقييم.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-300/80">مطلوب الإجراء</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-2">
            {pendingCompletionBookings.map((b: any) => {
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
                    referenceCode: b.reference_code,
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Financial & Schedule Capacity Metrics Grid */}
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
            <div className="mt-3 text-2xl font-black text-[var(--text)] font-mono tabular">
              {totalEarnings.toLocaleString("en-US")} <span className="text-xs font-bold text-[var(--muted)]">ج.م</span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--line-soft)] text-[11px]">
              <span className="text-[var(--muted-2)]">أرباح هذا الشهر:</span>
              <span className="font-bold text-emerald-400 font-mono">
                +{monthEarnings.toLocaleString("en-US")} ج.م
              </span>
            </div>
            {pendingEarnings > 0 && (
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-[var(--muted-2)]">حجوزات قادمة مؤكدة:</span>
                <span className="font-bold text-cobalt-300 font-mono">
                  {pendingEarnings.toLocaleString("en-US")} ج.م
                </span>
              </div>
            )}
          </div>

          {/* Card 2: Schedule Capacity & Utilization Rate (Corrected Math) */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-cobalt-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)]">إشغال الجدول هذا الأسبوع</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-cobalt-500/10 text-cobalt-300">
                <CalendarRange size={17} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-[var(--text)] font-mono tabular">
              {totalWeeklyCapacityHours > 0 ? (
                <>
                  {capacityPct}%{" "}
                  <span className="text-xs font-bold text-[var(--muted)]">
                    ({thisWeekBookingsCount} من {totalWeeklyCapacityHours} ساعة)
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
                <span>السعة: {totalWeeklyCapacityHours} ساعة/أسبوع</span>
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
            <div className="mt-3 text-2xl font-black text-[var(--text)] font-mono tabular">
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

          {/* Card 4: Coaching Quality & Completed Sessions */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-cobalt-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)]">تقييم الجودة وإنجاز الحصص</span>
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-cobalt-500/10 text-cobalt-300">
                <Award size={17} />
              </div>
            </div>
            <div className="mt-3 text-2xl font-black text-[var(--text)] font-mono tabular">
              {Number(coach.rating ?? 5.0).toFixed(1)}{" "}
              <span className="text-sm text-amber-400">★</span>{" "}
              <span className="text-xs font-bold text-[var(--muted)]">
                ({coach.total_reviews ?? 0} تقييم)
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--line-soft)] text-[11px]">
              <span className="text-[var(--muted-2)]">الحصص المنجزة:</span>
              <span className="font-bold text-emerald-400 font-mono">{completedCount} جلسة</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-[var(--muted-2)]">حالة الاعتماد:</span>
              <span className="font-bold text-cobalt-300">
                {coach.is_verified ? "مدرب موثّق رسمياً" : "قيد المراجعة"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trainee Lifecycle Hub & Rebooking/Renewal Alerts */}
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
          <span className="text-xs text-[var(--muted-2)] font-mono">
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
                    referenceCode: b.reference_code,
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
