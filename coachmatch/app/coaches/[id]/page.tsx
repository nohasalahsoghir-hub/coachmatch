import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getCoachById } from "@/lib/actions/coaches";
import { BookingForm } from "@/components/athlete/BookingForm";

export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coach = await getCoachById(id).catch(() => null);
  if (!coach) notFound();

  const profile = (coach as any).profiles;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">{profile?.full_name}</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-amber-400">
          <Star size={14} fill="currentColor" />
          {coach.rating.toFixed(1)} ({coach.total_reviews} تقييم)
        </p>
        <p className="mt-2 text-sm text-neutral-400">{coach.bio}</p>
        <p className="mt-2 text-xs text-neutral-500">{coach.sports.join(" · ")}</p>
      </div>

      <BookingForm
        coachId={coach.id}
        sessionRate={coach.session_rate}
        packageRate={coach.package_8_rate}
        locations={coach.training_locations}
      />
    </div>
  );
}
