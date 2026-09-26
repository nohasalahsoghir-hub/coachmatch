import Link from "next/link";
import { Filter, ShieldCheck, Sparkles } from "lucide-react";
import { CoachCard } from "@/components/athlete/CoachCard";
import { CoachFilters } from "@/components/athlete/CoachFilters";
import { getCoachFilterOptions, getDemoSports, getVerifiedCoaches } from "@/lib/demo";

export default async function CoachesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const filters = {
    q: params.q,
    sport: params.sport,
    location: params.location,
    maxRate: params.maxRate ? Number(params.maxRate) : undefined,
    available: params.available === "true",
  };
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 24;
  const [coaches, options, sports] = await Promise.all([getVerifiedCoaches(filters), getCoachFilterOptions(), getDemoSports()]);
  const total = coaches.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pages);
  const visible = coaches.slice((safePage - 1) * pageSize, safePage * pageSize);
  const makePage = (n: number) => {
    const p = new URLSearchParams();
    for (const [k,v] of Object.entries(params)) if (v && k !== "page") p.set(k,v);
    if (n > 1) p.set("page", String(n));
    return p.toString() ? `/coaches?${p}` : "/coaches";
  };
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-neutral-800 bg-gradient-to-br from-emerald-950/80 via-neutral-900 to-neutral-950 p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-300"><Sparkles size={14}/>اكتشف مدربك</div>
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight md:text-4xl">اختار الرياضة والهدف والمكان، وسيب الباقي على CoachMatch.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-400">ملفات مدربين موثّقة، أسعار واضحة، ومواعيد قابلة للحجز بدل البحث العشوائي.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-neutral-400"><span className="inline-flex items-center gap-1 rounded-full bg-neutral-950/80 px-3 py-1.5"><ShieldCheck size={13} className="text-emerald-400"/>مدربون موثّقون</span><span className="rounded-full bg-neutral-950/80 px-3 py-1.5">{sports.length} رياضة</span><span className="rounded-full bg-neutral-950/80 px-3 py-1.5">{total} نتيجة</span></div>
      </section>

      <CoachFilters sports={options.sports} locations={options.locations} />

      {visible.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-neutral-700 bg-neutral-900/60 p-10 text-center">
          <Filter className="mx-auto text-neutral-600" size={30}/>
          <h2 className="mt-3 text-lg font-bold">مش لقينا نتيجة مطابقة</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">جرّبي رياضة أو مكان مختلف، أو امسحي الفلاتر وشوفي كل المدربين المتاحين.</p>
          <Link href="/coaches" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-bold">عرض كل المدربين</Link>
        </section>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">{visible.map((c: any) => <CoachCard key={c.id} id={c.id} name={c.profiles?.full_name ?? c.full_name ?? "مدرب"} avatarUrl={c.profiles?.avatar_url ?? c.avatar_url} headline={c.headline} sports={c.sports ?? []} sessionRate={c.session_rate} locations={c.training_locations ?? []} rating={c.rating} totalReviews={c.total_reviews} availableToday={Boolean(c.is_available_today)} experienceYears={c.experience_years} isVerified={Boolean(c.is_verified)} isDemo={Boolean(c.is_demo)} />)}</div>
          {pages > 1 && <nav className="flex flex-wrap justify-center gap-2 pt-2" aria-label="صفحات المدربين">{Array.from({length: pages}, (_,i)=>i+1).map((n)=><Link key={n} href={makePage(n)} className={`min-h-11 min-w-11 rounded-xl px-3 py-2 text-center text-sm font-bold ${n===safePage?"bg-emerald-600 text-white":"border border-neutral-700 bg-neutral-900 text-neutral-400"}`}>{n}</Link>)}</nav>}
        </>
      )}
    </div>
  );
}
