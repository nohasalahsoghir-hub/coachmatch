import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  FileUp,
  Image as ImageIcon,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityToggle } from "@/components/coach/AvailabilityToggle";
import { AvailabilityEditor } from "@/components/coach/AvailabilityEditor";
import { CoachSelfManagementForm } from "@/components/coach/CoachSelfManagementForm";

export const metadata = {
  title: "إدارة بيانات وأسعار المدرب | CoachMatch",
  description: "تعديل البيانات الأساسية، التسعير، المحافظات، رفع السيرة الذاتية، وضبط جدول المواعيد الأسبوعية.",
};

export default async function CoachProfilePage() {
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { data: profile },
    { data: coach },
    { data: sports },
    { data: availability },
  ] = await Promise.all([
    s
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    s
      .from("coaches")
      .select(
        "headline, bio, session_rate, package_8_rate, sports, training_locations, languages, is_verified, accepting_bookings, cv_url, instapay_address"
      )
      .eq("id", user.id)
      .maybeSingle(),
    s
      .from("sports")
      .select("slug, name_ar")
      .eq("is_active", true)
      .order("sort_order"),
    s
      .from("coach_availability")
      .select("day_of_week, start_time, end_time, is_active")
      .eq("coach_id", user.id)
      .order("day_of_week")
      .order("start_time"),
  ]);

  if (profile?.role !== "coach" || !coach) redirect("/dashboard");

  // Calculate Profile Readiness Score (20% for each key pillar)
  const hasAvatar = Boolean(profile?.avatar_url);
  const hasCv = Boolean(coach.cv_url);
  const hasProfileData = Boolean(
    coach.headline && coach.bio && (coach.sports?.length ?? 0) > 0 && Number(coach.session_rate) > 0
  );
  const hasInstaPay = Boolean(coach.instapay_address?.trim());
  const hasSchedule = (availability ?? []).some((x: any) => x.is_active);

  const pillars = [
    { label: "الصورة الشخصية", done: hasAvatar, icon: ImageIcon },
    { label: "السيرة الذاتية (CV)", done: hasCv, icon: FileUp },
    { label: "البيانات والأسعار", done: hasProfileData, icon: SlidersHorizontal },
    { label: "حساب إنستاباي للتسوية", done: hasInstaPay, icon: CreditCard },
    { label: "الجدول الأسبوعي", done: hasSchedule, icon: CalendarRange },
  ];

  const completionScore = Math.round(
    (pillars.filter((p) => p.done).length / pillars.length) * 100
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <Link
        href="/coach/dashboard"
        className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)] hover:text-white transition"
      >
        <ArrowRight size={14} />
        العودة للوحة تحليلات المدرب
      </Link>

      {/* Hero Card with Verification & Acceptance Gating */}
      <section className="rounded-[2.5rem] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cobalt-300">
              <Sparkles size={13} />
              إدارة ملفك وحسابك المهني
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text)]">
              كل إعداداتك وبياناتك في مكان واحد
            </h1>
            <p className="text-xs sm:text-sm leading-6 text-[var(--muted)] max-w-xl">
              الأسعار، السيرة الذاتية، حساب استلام الأرباح عبر إنستاباي، والجدول الأسبوعي واستقبال الحجوزات.
            </p>
          </div>

          {/* Gated Availability Toggle */}
          <div className="shrink-0">
            <AvailabilityToggle
              initial={Boolean(coach.accepting_bookings)}
              isVerified={Boolean(coach.is_verified)}
            />
          </div>
        </div>

        {/* Verification Status Banner with Clear Timeline SLA */}
        {!coach.is_verified ? (
          <div className="mt-6 flex flex-col sm:flex-row items-start gap-3.5 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4 text-xs">
            <ShieldAlert className="mt-0.5 shrink-0 text-amber-300" size={20} />
            <div className="space-y-1">
              <p className="font-black text-sm text-amber-100">
                حسابك قيد المراجعة والتوثيق من إدارة المنصة
              </p>
              <p className="leading-6 text-amber-100/75">
                يستغرق فحص ومراجعة المستندات عادةً من <b>ساعتين إلى 24 ساعة كحد أقصى</b>. سيصلك إشعار بالاعتماد وتفعيل زر الحجوزات تلقائيًا فور اكتمال مراجعة شهاداتك وسيرتك الذاتية لضمان أمان المتدربين.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-300">
            <ShieldCheck size={19} className="text-emerald-400" />
            <span>حسابك موثّق ومعتمد رسميًا من إدارة CoachMatch ✓ — ملفك مؤهل للظهور في نتائج البحث المتقدم واستقبال الحجوزات.</span>
          </div>
        )}

        {/* Profile Readiness & Completion Meter */}
        <div className="mt-6 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-[var(--text)] flex items-center gap-1.5">
              <span>جاهزية واعتماد الملف الشخصي</span>
              <span className="text-[10px] text-cobalt-300 font-mono font-bold">
                ({completionScore}%)
              </span>
            </span>
            <span className="text-[11px] text-[var(--muted-2)]">
              {completionScore === 100 ? "ملفك مكتمل 100% ومستعد للعمل ✓" : "أكمل البنود المتبقية لتسريع التوثيق"}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionScore === 100 ? "bg-emerald-400" : "bg-[var(--cobalt)]"
              }`}
              style={{ width: `${completionScore}%` }}
            />
          </div>

          {/* Checklist Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {pillars.map((p, idx) => (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold transition ${
                  p.done
                    ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : "border border-[var(--line)] bg-[var(--surface-3)] text-[var(--muted-2)]"
                }`}
              >
                {p.done ? <CheckCircle2 size={12} /> : <p.icon size={12} />}
                <span>{p.label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Profile, Pricing, and Manual Settlement Form */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-cobalt-300" />
          <h2 className="text-xl font-black text-[var(--text)]">البيانات والأسعار والـ CV</h2>
        </div>
        <CoachSelfManagementForm
          initial={{
            headline: coach.headline ?? "",
            bio: coach.bio ?? "",
            session_rate: Number(coach.session_rate || 200),
            package_8_rate: Number(coach.package_8_rate || 1400),
            sports: coach.sports ?? [],
            training_locations: coach.training_locations ?? [],
            languages: coach.languages ?? ["العربية"],
            avatar_url: profile?.avatar_url ?? null,
            cv_url: coach.cv_url ?? null,
            instapay_address: coach.instapay_address ?? "",
          }}
          sports={sports ?? []}
        />
      </section>

      {/* Weekly Schedule Editor */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarRange size={18} className="text-cobalt-300" />
          <h2 className="text-xl font-black text-[var(--text)]">المواعيد الأسبوعية الشاغرة</h2>
        </div>
        <AvailabilityEditor
          initial={(availability ?? []).map((x: any) => ({
            day: Number(x.day_of_week),
            start_time: String(x.start_time).slice(0, 5),
            end_time: String(x.end_time).slice(0, 5),
            is_active: Boolean(x.is_active),
          }))}
        />
      </section>
    </div>
  );
}
