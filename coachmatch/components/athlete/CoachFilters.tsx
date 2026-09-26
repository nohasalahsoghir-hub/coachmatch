"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SPORTS = ["الكل", "Fitness", "Swimming", "Martial Arts"];

export function CoachFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("sport") ?? "الكل";

  function selectSport(sport: string) {
    const params = new URLSearchParams(searchParams);
    if (sport === "الكل") params.delete("sport");
    else params.set("sport", sport);
    router.push(`/coaches?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {SPORTS.map((sport) => (
        <button
          key={sport}
          onClick={() => selectSport(sport)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${
            active === sport ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {sport}
        </button>
      ))}
    </div>
  );
}
