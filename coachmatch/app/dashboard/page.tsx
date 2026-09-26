import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PackageProgressCard } from "@/components/athlete/PackageProgressCard";
import { NextSessionCard } from "@/components/athlete/NextSessionCard";
import { CoachCard } from "@/components/athlete/CoachCard";
import { getVerifiedCoaches } from "@/lib/actions/coaches";

export default async function AthleteDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const today = new Date().toISOString().slice(0, 10);

  const { data: nextBooking } = await supabase
    .from("bookings")
    .select(
      "id, session_date, start_time, location, coach:coaches!bookings_coach_id_fkey(id, profiles:profiles!coaches_id_fkey(full_name))"
    )
    .eq("athlete_id", user.id)
    .eq("status", "confirmed")
    .gte("session_date", today)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: activePackages } = await supabase
    .from("athlete_packages")
    .select("id, total_sessions, remaining_sessions, coach:coaches!athlete_packages_coach_id_fkey(profiles:profiles!coaches_id_fkey(full_name))")
    .eq("athlete_id", user.id)
    .eq("status", "active");

  const suggestedCoaches = await getVerifiedCoaches();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">أهلاً بيك 👋</h1>

      {nextBooking && (
        <NextSessionCard
          bookingId={nextBooking.id}
          coachName={(nextBooking as any).coach?.profiles?.full_name ?? "مدرب"}
          sessionDate={nextBooking.session_date}
          startTime={nextBooking.start_time}
          location={nextBooking.location}
        />
      )}

      {(activePackages ?? []).length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-neutral-300">باقاتك النشطة</h2>
          {(activePackages ?? []).map((p: any) => (
            <PackageProgressCard
              key={p.id}
              coachName={p.coach?.profiles?.full_name ?? "مدرب"}
              totalSessions={p.total_sessions}
              remainingSessions={p.remaining_sessions}
            />
          ))}
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-300">مدربين مقترحين</h2>
          <Link href="/coaches" className="flex items-center gap-1 text-xs text-emerald-400">
            عرض الكل <ArrowLeft size={12} />
          </Link>
        </div>
        <div className="space-y-3">
          {suggestedCoaches.slice(0, 4).map((c: any) => (
            <CoachCard
              key={c.id}
              id={c.id}
              name={c.profiles?.full_name ?? "مدرب"}
              sports={c.sports}
              sessionRate={c.session_rate}
              locations={c.training_locations}
              rating={c.rating}
              totalReviews={c.total_reviews}
              availableToday={c.is_available_today}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
