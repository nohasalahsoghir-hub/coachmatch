import Link from "next/link";
import { ArrowLeft, BadgeCheck, Clock3, MapPin, Star } from "lucide-react";

/* ─── Sport-family colour mapping ─────────────────────────────────────────── */
export type SportCategory =
  | "Martial Arts"
  | "Water Sports"
  | "Fitness"
  | "Endurance"
  | "Movement"
  | "Racquet Sports"
  | "Team Sports"
  | string;

const CATEGORY_STYLE: Record<string, { border: string; bg: string; text: string; label: string }> = {
  "Martial Arts":  { border: "var(--combat)",  bg: "var(--combat-bg)",  text: "#F98787", label: "قتالي"   },
  "Water Sports":  { border: "var(--water)",   bg: "var(--water-bg)",   text: "#7DD3F0", label: "مائي"    },
  "Fitness":       { border: "var(--fit)",     bg: "var(--fit-bg)",     text: "#FFAB8F", label: "لياقة"   },
  "Endurance":     { border: "var(--fit)",     bg: "var(--fit-bg)",     text: "#FFAB8F", label: "تحمّل"   },
  "Movement":      { border: "var(--fit)",     bg: "var(--fit-bg)",     text: "#FFAB8F", label: "حركة"    },
  "Racquet Sports":{ border: "var(--racquet)", bg: "var(--racquet-bg)", text: "#B4E55A", label: "مضرب"    },
  "Team Sports":   { border: "var(--team)",    bg: "var(--team-bg)",    text: "#C4B0FF", label: "جماعي"   },
};
const DEFAULT_STYLE = { border: "var(--flare)", bg: "var(--fit-bg)", text: "#FFAB8F", label: "" };

function styleFor(category?: string) {
  return category ? (CATEGORY_STYLE[category] ?? DEFAULT_STYLE) : DEFAULT_STYLE;
}

/* ─── Props ────────────────────────────────────────────────────────────────── */
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

/* ─── Component ────────────────────────────────────────────────────────────── */
export function CoachCard({
  id, name, avatarUrl, headline, sports, category,
  sessionRate, locations, rating, totalReviews,
  availableToday, experienceYears,
}: CoachCardProps) {
  const style = styleFor(category);

  return (
    <article
      className="group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
      style={{
        borderColor: "var(--line)",
        background: "var(--surface)",
        borderRightWidth: "3px",
        borderRightColor: style.border,
        boxShadow: "0 1px 4px rgba(0,0,0,.4)",
      }}
      id={`coach-card-${id}`}
    >
      {/* Subtle card glow on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,106,61,.06), transparent)` }}
        aria-hidden
      />

      <div className="p-4">
        {/* Top row: avatar + name */}
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
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-bold" style={{ fontFamily: "var(--font-cairo)" }}>
                {name}
              </h3>
              <BadgeCheck size={14} className="shrink-0" style={{ color: "var(--flare)" }} />
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs leading-5" style={{ color: "var(--muted)" }}>
              {headline ?? sports.join(" · ")}
            </p>
          </div>
        </div>

        {/* Sport + XP + availability pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {sports[0] && (
            <span
              className="rounded-full px-2.5 py-1 font-semibold"
              style={{ background: style.bg, color: style.text }}
            >
              {sports[0]}
            </span>
          )}
          <span
            className="rounded-full px-2.5 py-1"
            style={{ background: "rgba(255,255,255,.05)", color: "var(--muted)" }}
          >
            {experienceYears} سنين خبرة
          </span>
          {availableToday ? (
            <span className="rounded-full px-2.5 py-1 font-bold"
              style={{ background: "rgba(120,200,0,.12)", color: "#B4E55A" }}>
              متاح اليوم
            </span>
          ) : (
            <span className="rounded-full px-2.5 py-1"
              style={{ background: "rgba(255,255,255,.04)", color: "var(--muted-2)" }}>
              حسب الجدول
            </span>
          )}
        </div>

        {/* Location + price */}
        <div className="mt-3 grid gap-1.5 text-xs" style={{ color: "var(--muted-2)" }}>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={12} />
            {locations[0] ?? "أونلاين"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={12} />
            جلسة{" "}
            <span className="font-black tabular" style={{ color: "var(--flare)", fontFamily: "var(--font-changa)" }}>
              {Number(sessionRate).toLocaleString("ar-EG")}
            </span>{" "}
            ج.م
          </span>
        </div>

        {/* Footer: rating + CTA */}
        <div
          className="mt-4 flex items-center justify-between border-t pt-3"
          style={{ borderColor: "var(--line-soft)" }}
        >
          <span className="inline-flex items-center gap-1 text-sm font-bold"
            style={{ color: "#FCD34D" }}>
            <Star size={13} fill="currentColor" />
            <span className="tabular">{Number(rating).toFixed(1)}</span>
            <span className="text-xs font-normal" style={{ color: "var(--muted-2)" }}>
              ({totalReviews})
            </span>
          </span>

          <Link
            href={`/coaches/${id}`}
            id={`coach-card-cta-${id}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-xs font-black transition-all duration-200 hover:gap-3"
            style={{ background: "var(--flare)", color: "#1a0800" }}
          >
            عرض الملف
            <ArrowLeft size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
