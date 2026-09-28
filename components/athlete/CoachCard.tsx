import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CircleDot,
  Clock3,
  Dumbbell,
  MapPin,
  Star,
  Swords,
  Users,
  Waves,
  type LucideIcon,
} from "lucide-react";

export type SportCategory =
  | "Martial Arts"
  | "Water Sports"
  | "Fitness"
  | "Endurance"
  | "Movement"
  | "Racquet Sports"
  | "Team Sports"
  | string;

type CategoryStyle = {
  border: string;
  bg: string;
  text: string;
  label: string;
  icon: LucideIcon;
};

const CATEGORY_STYLE: Record<string, CategoryStyle> = {
  "Martial Arts":  { border: "var(--combat)",  bg: "var(--combat-bg)",  text: "#FFAA8A", label: "قتالي", icon: Swords },
  "Water Sports":  { border: "var(--water)",   bg: "var(--water-bg)",   text: "#7DD3F0", label: "مائي",  icon: Waves },
  "Fitness":       { border: "var(--fit)",     bg: "var(--fit-bg)",     text: "#F5C978", label: "لياقة", icon: Dumbbell },
  "Endurance":     { border: "var(--fit)",     bg: "var(--fit-bg)",     text: "#F5C978", label: "تحمّل", icon: Dumbbell },
  "Movement":      { border: "var(--fit)",     bg: "var(--fit-bg)",     text: "#F5C978", label: "حركة",  icon: Dumbbell },
  "Racquet Sports":{ border: "var(--racquet)", bg: "var(--racquet-bg)", text: "#72D8D8", label: "مضرب",  icon: CircleDot },
  "Team Sports":   { border: "var(--team)",    bg: "var(--team-bg)",    text: "#C4B0FF", label: "جماعي", icon: Users },
};

const DEFAULT_STYLE: CategoryStyle = {
  border: "var(--line)",
  bg: "var(--surface-2)",
  text: "var(--muted)",
  label: "",
  icon: Dumbbell,
};

function styleFor(category?: string) {
  return category ? (CATEGORY_STYLE[category] ?? DEFAULT_STYLE) : DEFAULT_STYLE;
}

interface CoachCardProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  sports: string[];
  category?: string;
  sessionRate: number;
  locations: string[];
  rating: number;
  totalReviews: number;
  availableToday: boolean;
  experienceYears: number;
}

export function CoachCard({
  id, name, avatarUrl, headline, sports, category,
  sessionRate, locations, rating, totalReviews,
  availableToday, experienceYears,
}: CoachCardProps) {
  const style = styleFor(category);
  const CategoryIcon = style.icon;

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
      style={{
        borderRightWidth: "3px",
        borderRightColor: style.border,
        boxShadow: "0 1px 4px rgba(0,0,0,.4)",
      }}
      id={`coach-card-${id}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(62,111,242,.06), transparent)" }}
        aria-hidden
      />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-black"
              style={{ background: style.bg, color: style.text }}
            >
              {name.slice(0, 1)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-bold">{name}</h3>
              <BadgeCheck size={14} className="shrink-0 text-[var(--cobalt)]" />
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
              {headline ?? sports.join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {sports[0] && (
            <span
              className="sport-badge"
              style={{ background: style.bg, color: style.text }}
            >
              <CategoryIcon size={13} aria-hidden />
              {sports[0]}
            </span>
          )}
          <span className="sport-badge bg-white/5 text-[var(--muted)]">
            {experienceYears} سنين خبرة
          </span>
          {availableToday ? (
            <span className="sport-badge bg-[rgba(0,166,166,.12)] text-[#72D8D8]">
              متاح اليوم
            </span>
          ) : (
            <span className="sport-badge bg-white/[.04] text-[var(--muted-2)]">
              حسب الجدول
            </span>
          )}
        </div>

        <div className="mt-3 grid gap-2 text-xs text-[var(--muted-2)]">
          <span className="inline-flex items-center gap-2">
            <MapPin size={12} />
            {locations[0] ?? "أونلاين"}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 size={12} />
            جلسة{" "}
            <span className="font-black tabular text-[var(--cobalt)]">
              {Number(sessionRate).toLocaleString("ar-EG")}
            </span>{" "}
            ج.م
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--line-soft)] pt-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-300">
            <Star size={13} fill="currentColor" />
            <span className="tabular">{Number(rating).toFixed(1)}</span>
            <span className="text-xs font-normal text-[var(--muted-2)]">
              ({totalReviews})
            </span>
          </span>

          <Link
            href={`/coaches/${id}`}
            id={`coach-card-cta-${id}`}
            className="btn-cobalt min-h-10 text-xs"
          >
            عرض الملف
            <ArrowLeft size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
