import Link from "next/link";
import { Star, MapPin } from "lucide-react";

type Props = {
  id: string;
  name: string;
  sports: string[];
  sessionRate: number;
  locations: string[];
  rating: number;
  totalReviews: number;
  availableToday: boolean;
};

export function CoachCard({
  id,
  name,
  sports,
  sessionRate,
  locations,
  rating,
  totalReviews,
  availableToday,
}: Props) {
  return (
    <Link
      href={`/coaches/${id}`}
      className="block rounded-xl bg-neutral-900 p-4 transition hover:bg-neutral-800"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold">{name}</p>
          <p className="text-xs text-neutral-400">{sports.join(" · ")}</p>
        </div>
        {availableToday && (
          <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            متاح اليوم
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1 text-amber-400">
          <Star size={14} fill="currentColor" />
          {rating.toFixed(1)} ({totalReviews})
        </span>
        <span className="flex items-center gap-1 text-neutral-400">
          <MapPin size={14} />
          {locations[0] ?? "—"}
        </span>
        <span className="font-semibold text-emerald-400">{sessionRate} ج.م / حصة</span>
      </div>
    </Link>
  );
}
