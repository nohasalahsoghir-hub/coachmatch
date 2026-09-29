import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { CoachCard } from "@/components/athlete/CoachCard";
import { CoachFilters } from "@/components/athlete/CoachFilters";
import { getCoachFilterOptions, getSports, getVerifiedCoaches } from "@/lib/marketplace";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const filters = {
    q: p.q,
    sport: p.sport,
    location: p.location,
    maxRate: p.maxRate ? Number(p.maxRate) : undefined,
    available: p.available === "true",
  };
  const [coaches, options, sports] = await Promise.all([
    getVerifiedCoaches(filters),
    getCoachFilterOptions(),
    getSports(),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-cobalt-300">
              <Sparkles size={14} />
              اكتشاف المدربين
            </div>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              مدربين حقيقيين، مواعيد واضحة، وحجز منظم.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              اختيار الرياضة والمكان والسعر لعرض عدد المواعيد المتاحة فعليًا قبل فتح الملف.
            </p>
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-500/10 px-3 py-1.5 text-cobalt-300">
              <ShieldCheck size={13} />
              موثقون
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1.5 text-[var(--muted)]">
              {sports.length} رياضة
            </span>
          </div>
        </div>

        <div className="mt-7">
          <CoachFilters
            sports={options.sports}
            locations={options.locations}
            values={{
              q: p.q,
              sport: p.sport,
              location: p.location,
              maxRate: p.maxRate,
              available: p.available === "true",
            }}
          />
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{coaches.length} نتيجة</p>
        <Link
          href="/auth/sign-up?role=coach"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-cobalt-300 hover:underline"
        >
          <Trophy size={14} />
          الانضمام كمدرب
        </Link>
      </div>

      {coaches.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c: any) => (
            <CoachCard
              key={c.id}
              id={c.id}
              name={c.full_name ?? "مدرب"}
              avatarUrl={c.avatar_url}
              headline={c.headline}
              sports={c.sports ?? []}
              sessionRate={Number(c.session_rate)}
              locations={c.training_locations ?? []}
              rating={Number(c.rating)}
              totalReviews={Number(c.total_reviews)}
              availableTodaySlots={Number(c.available_today_slots ?? 0)}
              experienceYears={Number(c.experience_years ?? 0)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="مش لقينا نتائج"
          text="يمكن تغيير الرياضة أو المنطقة أو السعر، أو مسح الفلاتر."
          href="/coaches"
          label="عرض كل المدربين"
        />
      )}

      {/* Dedicated Coach Onboarding Card */}
      <section className="mt-12 rounded-3xl border border-[var(--line)] bg-[var(--surface-2)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cobalt-300">
              <Trophy size={14} />
              <span>انضم لمنصة CoachMatch</span>
            </div>
            <h3 className="mt-2 text-xl font-black">هل أنت مدرب أو كابتن رياضي؟</h3>
            <p className="mt-1 text-xs text-[var(--muted)] leading-6 max-w-xl">
              سجّل كمدرب معتمد، اعرض خبراتك وأسعار حصصك التدريبية، وابدأ في استقبال المتدربين في منطقتك بكل موثوقية.
            </p>
          </div>
          <Link
            href="/auth/sign-up?role=coach"
            className="btn-cobalt shrink-0 min-h-11 px-5 text-xs font-black"
          >
            سجّل كمدرب الآن <ArrowLeft size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
