import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock3, MapPin, Star } from "lucide-react";

type Props = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  sports: string[];
  sessionRate: number;
  locations: string[];
  rating: number;
  totalReviews: number;
  availableToday: boolean;
  experienceYears?: number;
  isVerified?: boolean;
  isDemo?: boolean;
};

export function CoachCard({
  id, name, avatarUrl, headline, sports, sessionRate, locations, rating, totalReviews,
  availableToday, experienceYears, isVerified = true, isDemo = false,
}: Props) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/40">
      <Link href={`/coaches/${id}`} className="block p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
        <div className="flex gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
          ) : (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-xl font-extrabold text-emerald-300">{name.slice(0, 1)}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="flex items-center gap-1 text-base font-extrabold">
                  <span className="truncate">{name.replace(/ • .*$/, "")}</span>
                  {isVerified && <BadgeCheck size={15} className="shrink-0 text-emerald-400" />}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-400">{headline ?? sports.join(" · ")}</p>
              </div>
              {isDemo && <span className="shrink-0 rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-semibold text-amber-300">Demo</span>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-neutral-400">
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-1 text-amber-300"><Star size={12} fill="currentColor" />{rating.toFixed(1)}{isDemo ? " · تقييم تجريبي" : (totalReviews > 0 ? ` · ${totalReviews} تقييم` : "")}</span>
          {experienceYears ? <span className="rounded-full bg-neutral-800 px-2.5 py-1">{experienceYears} سنين خبرة</span> : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-2.5 py-1"><MapPin size={12} />{locations[0] ?? "أونلاين"}</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-neutral-800 pt-3">
          <div>
            <div className="text-[11px] text-neutral-500">سعر الحصة</div>
            <div className="text-lg font-extrabold text-emerald-300">{sessionRate.toLocaleString("ar-EG")} ج.م</div>
          </div>
          <div className="text-left">
            <div className={`mb-1 text-[11px] ${availableToday ? "text-emerald-300" : "text-neutral-500"}`}>
              <Clock3 size={12} className="ml-1 inline" />{availableToday ? "متاح اليوم" : "غير متاح اليوم"}
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-300 group-hover:text-emerald-300">عرض الملف <ArrowLeft size={13} /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
