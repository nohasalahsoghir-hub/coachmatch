import { getVerifiedCoaches } from "@/lib/actions/coaches";
import { CoachCard } from "@/components/athlete/CoachCard";
import { CoachFilters } from "@/components/athlete/CoachFilters";

export default async function CoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string }>;
}) {
  const { sport } = await searchParams;
  const coaches = await getVerifiedCoaches({ sport });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">اكتشف المدربين</h1>
      <CoachFilters />

      {coaches.length === 0 ? (
        <p className="rounded-xl bg-neutral-900 p-6 text-center text-sm text-neutral-500">
          مفيش مدربين متاحين بالفلتر ده حاليًا
        </p>
      ) : (
        <div className="space-y-3">
          {coaches.map((c: any) => (
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
      )}
    </div>
  );
}
