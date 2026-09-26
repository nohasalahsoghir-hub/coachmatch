import { createClient } from "@/lib/supabase/server";

export type DirectoryFilters = {
  sport?: string;
  location?: string;
  maxRate?: number;
  q?: string;
  available?: boolean;
};

export type AvailabilityDay = {
  date: string;
  label: string;
  slots: string[];
};

function cairoDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(dateString: string, days: number) {
  const [y, m, d] = dateString.split("-").map(Number);
  const value = new Date(Date.UTC(y, m - 1, d));
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function parseTime(value: string) {
  const [h, m] = value.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function formatTime(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T12:00:00+03:00`));
}

export async function getDemoSports() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sports")
    .select("id, slug, name_ar, name_en, category, icon")
    .eq("is_demo", true)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCoachFilterOptions() {
  const supabase = await createClient();
  const [{ data: demo }, { data: real }, { data: sports }] = await Promise.all([
    supabase.from("demo_coaches").select("training_locations").eq("is_demo", true),
    supabase.from("coaches").select("training_locations").eq("is_verified", true),
    supabase.from("sports").select("slug,name_ar").eq("is_demo", true).eq("is_active", true).order("sort_order"),
  ]);
  const values = new Set<string>();
  for (const row of [...(demo ?? []), ...(real ?? [])]) {
    for (const location of row.training_locations ?? []) values.add(location);
  }
  return { sports: sports ?? [], locations: [...values].sort() };
}

async function getRealCoachProfiles(ids: string[]) {
  if (!ids.length) return new Map<string, { full_name: string; avatar_url: string | null }>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coach_public_profiles")
    .select("id,full_name,avatar_url")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row: any) => [row.id, row]));
}

export async function getVerifiedCoaches(filters: DirectoryFilters = {}) {
  const supabase = await createClient();
  const [{ data: real, error: realError }, { data: demo, error: demoError }, { data: sports }] = await Promise.all([
    supabase
      .from("coaches")
      .select("id,bio,sports,session_rate,package_8_rate,training_locations,is_available_today,is_verified,rating,total_reviews,experience_years,headline,languages")
      .eq("is_verified", true),
    supabase
      .from("demo_coaches")
      .select("id,sport_id,full_name,avatar_url,headline,bio,experience_years,session_rate,package_8_rate,rating,total_reviews,training_locations,languages,specialization,is_verified,is_available_today,is_demo")
      .eq("is_demo", true),
    supabase.from("sports").select("id,slug,name_ar,name_en").eq("is_demo", true).eq("is_active", true),
  ]);
  if (realError) throw new Error(realError.message);
  if (demoError) throw new Error(demoError.message);

  const profileMap = await getRealCoachProfiles((real ?? []).map((c: any) => c.id));
  const sportMap = new Map((sports ?? []).map((s: any) => [s.id, s]));
  const normalize = (row: any, isDemo: boolean) => ({
    ...row,
    session_rate: Number(row.session_rate),
    package_8_rate: Number(row.package_8_rate),
    rating: Number(row.rating),
    total_reviews: Number(row.total_reviews ?? 0),
    is_demo: isDemo,
  });

  const realRows = (real ?? []).map((c: any) => ({
    ...normalize(c, false),
    profiles: profileMap.get(c.id) ?? { full_name: "مدرب", avatar_url: null },
  }));

  const demoRows = (demo ?? []).map((c: any) => {
    const sport = sportMap.get(c.sport_id);
    return {
      ...normalize(c, true),
      sports: sport ? [sport.name_ar] : ["رياضة"],
      sport_slug: sport?.slug ?? "",
      profiles: { full_name: c.full_name, avatar_url: c.avatar_url ?? null },
    };
  });

  const all = [...realRows, ...demoRows]
    .filter((c: any) => {
      const q = filters.q?.trim().toLowerCase();
      const sport = filters.sport?.toLowerCase();
      const location = filters.location;
      if (q) {
        const haystack = [
          c.profiles?.full_name,
          c.headline,
          c.bio,
          ...(c.sports ?? []),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (sport) {
        const names = (c.sports ?? []).map((x: string) => x.toLowerCase());
        const slug = String((c as any).sport_slug ?? "").toLowerCase();
        if (!names.some((name: string) => name.includes(sport)) && !slug.includes(sport)) return false;
      }
      if (location && !(c.training_locations ?? []).includes(location)) return false;
      if (filters.maxRate && Number(c.session_rate) > filters.maxRate) return false;
      if (filters.available === true && !c.is_available_today) return false;
      return true;
    })
    .sort((a: any, b: any) => Number(b.rating) - Number(a.rating));

  return all;
}

export async function getCoachById(id: string) {
  const supabase = await createClient();
  const { data: real, error: realError } = await supabase
    .from("coaches")
    .select("id,bio,sports,session_rate,package_8_rate,training_locations,is_available_today,is_verified,rating,total_reviews,experience_years,headline,languages")
    .eq("id", id)
    .eq("is_verified", true)
    .maybeSingle();
  if (realError) throw new Error(realError.message);
  if (real) {
    const profiles = await getRealCoachProfiles([id]);
    return {
      ...real,
      ...Object.fromEntries(["session_rate","package_8_rate","rating"].map((key) => [key, Number((real as any)[key])])),
      profiles: profiles.get(id) ?? { full_name: "مدرب", avatar_url: null },
      is_demo: false,
    };
  }

  const { data: demo, error: demoError } = await supabase
    .from("demo_coaches")
    .select("id,sport_id,full_name,avatar_url,headline,bio,experience_years,session_rate,package_8_rate,rating,total_reviews,training_locations,languages,specialization,is_verified,is_available_today,is_demo")
    .eq("id", id)
    .eq("is_demo", true)
    .maybeSingle();
  if (demoError) throw new Error(demoError.message);
  if (!demo) return null;
  const { data: sport } = await supabase
    .from("sports")
    .select("id,slug,name_ar,name_en,category,icon")
    .eq("id", demo.sport_id)
    .maybeSingle();
  return {
    ...demo,
    session_rate: Number(demo.session_rate),
    package_8_rate: Number(demo.package_8_rate),
    rating: Number(demo.rating),
    profiles: { full_name: demo.full_name, avatar_url: demo.avatar_url ?? null, phone: null },
    sports: sport ? [sport.name_ar] : ["رياضة"],
    sport,
    is_demo: true,
  };
}


export async function getRealAvailability(coachId: string, days = 14): Promise<AvailabilityDay[]> {
  const supabase = await createClient();
  const [{ data: availability, error: availabilityError }, { data: bookings, error: bookingError }, { data: blocked, error: blockedError }] = await Promise.all([
    supabase.from("coach_availability").select("day_of_week,start_time,end_time,is_active").eq("coach_id", coachId).eq("is_active", true),
    supabase.from("bookings").select("session_date,start_time,end_time,status").eq("coach_id", coachId).in("status", ["pending","confirmed"]),
    supabase.from("coach_blocked_slots").select("starts_at,ends_at").eq("coach_id", coachId),
  ]);
  if (availabilityError) throw new Error(availabilityError.message);
  if (bookingError) throw new Error(bookingError.message);
  if (blockedError) throw new Error(blockedError.message);

  const booked = (bookings ?? []).map((b: any) => ({ date: b.session_date, start: parseTime(b.start_time), end: parseTime(b.end_time) }));
  const blockedRows = (blocked ?? []).map((b: any) => ({ start: new Date(b.starts_at).getTime(), end: new Date(b.ends_at).getTime() }));
  const startDate = cairoDateString();
  const nowCairo = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  const nowMinutes = parseTime(nowCairo);
  const result: AvailabilityDay[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = addDays(startDate, i);
    const [y, m, d] = date.split("-").map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const dayAvailability = (availability ?? []).filter((a: any) => Number(a.day_of_week) === dayOfWeek);
    const slots = new Set<string>();
    for (const a of dayAvailability) {
      const from = parseTime(a.start_time);
      const to = parseTime(a.end_time);
      for (let t = from; t + 60 <= to; t += 60) {
        const clash = booked.some((b) => b.date === date && t < b.end && t + 60 > b.start);
        const isoStart = new Date(`${date}T${formatTime(t)}:00+03:00`).getTime();
        const isoEnd = new Date(`${date}T${formatTime(t + 60)}:00+03:00`).getTime();
        const blockedClash = blockedRows.some((b) => isoStart < b.end && isoEnd > b.start);
        const alreadyPassed = date === startDate && t <= nowMinutes;
        if (!clash && !blockedClash && !alreadyPassed) slots.add(formatTime(t));
      }
    }
    if (slots.size) result.push({ date, label: dateLabel(date), slots: [...slots].sort() });
  }
  return result;
}

export async function getDemoAvailability(coachId: string, days = 14): Promise<AvailabilityDay[]> {
  const supabase = await createClient();
  const [{ data: availability, error: availabilityError }, { data: bookings, error: bookingError }] = await Promise.all([
    supabase.from("demo_coach_availability").select("day_of_week,start_time,end_time,is_active").eq("coach_id", coachId).eq("is_demo", true).eq("is_active", true),
    supabase.from("demo_bookings").select("session_date,start_time,end_time,status").eq("coach_id", coachId).eq("is_demo", true).in("status", ["pending","confirmed"]),
  ]);
  if (availabilityError) throw new Error(availabilityError.message);
  if (bookingError) throw new Error(bookingError.message);

  const booked = (bookings ?? []).map((b: any) => ({ date: b.session_date, start: parseTime(b.start_time), end: parseTime(b.end_time) }));
  const startDate = cairoDateString();
  const nowCairo = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  const nowMinutes = parseTime(nowCairo);
  const result: AvailabilityDay[] = [];

  for (let i = 0; i < days; i += 1) {
    const date = addDays(startDate, i);
    const [y, m, d] = date.split("-").map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const dayAvailability = (availability ?? []).filter((a: any) => Number(a.day_of_week) === dayOfWeek);
    const slots = new Set<string>();
    for (const a of dayAvailability) {
      const from = parseTime(a.start_time);
      const to = parseTime(a.end_time);
      for (let t = from; t + 60 <= to; t += 60) {
        const clash = booked.some((b) => b.date === date && t < b.end && t + 60 > b.start);
        const alreadyPassed = date === startDate && t <= nowMinutes;
        if (!clash && !alreadyPassed) slots.add(formatTime(t));
      }
    }
    if (slots.size) result.push({ date, label: dateLabel(date), slots: [...slots].sort() });
  }
  return result;
}

export async function getDemoCoachReviews(id: string) {
  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from("demo_reviews")
    .select("id,rating,comment,created_at,athlete_id")
    .eq("coach_id", id)
    .eq("is_demo", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw new Error(error.message);
  if (!reviews?.length) return [];
  const ids = [...new Set(reviews.map((r: any) => r.athlete_id))];
  const { data: athletes } = await supabase.from("demo_athletes").select("id,full_name,avatar_url").in("id", ids);
  const map = new Map((athletes ?? []).map((a: any) => [a.id, a]));
  return reviews.map((r: any) => ({ ...r, athlete: map.get(r.athlete_id) ?? null, rating: Number(r.rating) }));
}
