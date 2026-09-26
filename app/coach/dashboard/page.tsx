import { redirect } from "next/navigation";
import Link from "next/link";
import { Banknote, CalendarDays, Settings2, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityToggle } from "@/components/coach/AvailabilityToggle";
import { BookingRow } from "@/components/coach/BookingRow";

type Coach = {
  is_available_today: boolean;
  rating: number | null;
  total_reviews: number | null;
};

type Booking = {
  id: string;
  start_time: string;
  end_time: string;
  session_date?: string;
  location: string;
  status: string;
  athlete_id: string;
  coach_net?: number | null;
  profiles?: { full_name: string | null; phone?: string | null }[] | null;
};

export default async function CoachDashboard() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) redirect("/auth/login");

  const { data: coachData } = await supabase
    .from("coaches")
    .select("is_available_today,rating,total_reviews")
    .eq("id", user.id)
    .single();

  if (!coachData) redirect("/auth/login");

  const coach = coachData as Coach;
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [todayResult, completedResult, pendingResult] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id,start_time,end_time,location,status,athlete_id,profiles:profiles!bookings_athlete_id_fkey(full_name,phone)"
      )
      .eq("coach_id", user.id)
      .eq("session_date", today)
      .order("start_time"),
    supabase
      .from("bookings")
      .select("coach_net,athlete_id,status")
      .eq("coach_id", user.id)
      .eq("status", "completed")
      .gte("session_date", weekAgo),
    supabase
      .from("bookings")
      .select(
        "id,start_time,end_time,session_date,location,status,athlete_id,profiles:profiles!bookings_athlete_id_fkey(full_name)"
      )
      .eq("coach_id", user.id)
      .eq("status", "pending")
      .order("session_date")
      .order("start_time")
      .limit(6),
  ]);

  const todayBookings = (todayResult.data ?? []) as Booking[];
  const completedBookings = (completedResult.data ?? []) as Booking[];
  const pendingBookings = (pendingResult.data ?? []) as Booking[];
  const earnings = completedBookings.reduce(
    (sum, booking) => sum + Number(booking.coach_net ?? 0),
    0
  );
  const trainees = new Set(completedBookings.map((booking) => booking.athlete_id)).size;

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-4 rounded-3xl border border-neutral-800 bg-neutral-900 p-5">
        <div>
          <p className="text-xs text-emerald-400">لوحة المدرب</p>
          <h1 className="mt-1 text-2xl font-black">إدارة يومك التدريبي</h1>
          <p className="mt-2 text-xs text-neutral-500">
            التأكيد المالي النهائي لا يحدث قبل الدفع وتسوية العملية.
          </p>
        </div>
        <AvailabilityToggle initial={coach.is_available_today} />
      </section>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={Banknote} value={`${earnings.toFixed(0)} ج.م`} label="دخل مكتمل" />
        <Stat icon={Users} value={trainees} label="متدربين" />
        <Stat icon={Star} value={Number(coach.rating ?? 0).toFixed(1)} label="التقييم" />
      </div>

      {pendingBookings.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold">طلبات تحتاج متابعة</h2>
            <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-300">
              {pendingBookings.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingBookings.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={{
                  id: booking.id,
                  start_time: booking.start_time,
                  end_time: booking.end_time,
                  location: booking.location,
                  status: booking.status,
                  athleteName: booking.profiles?.[0]?.full_name ?? "متدرب",
                  athletePhone: "",
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays size={17} className="text-emerald-400" />
          <h2 className="font-extrabold">جدول اليوم</h2>
        </div>

        {todayBookings.length > 0 ? (
          <div className="space-y-2">
            {todayBookings.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={{
                  id: booking.id,
                  start_time: booking.start_time,
                  end_time: booking.end_time,
                  location: booking.location,
                  status: booking.status,
                  athleteName: booking.profiles?.[0]?.full_name ?? "متدرب",
                  athletePhone: booking.profiles?.[0]?.phone ?? "",
                }}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-neutral-700 p-6 text-center text-sm text-neutral-500">
            مفيش حجوزات النهارده.
          </p>
        )}
      </section>

      <Link
        href="/coaches"
        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500"
      >
        <Settings2 size={14} />
        شوفي شكل رحلة المتدرب من الكتالوج
      </Link>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Banknote;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 text-center">
      <Icon size={17} className="mx-auto text-emerald-400" />
      <div className="mt-2 text-lg font-black">{value}</div>
      <div className="mt-1 text-[10px] text-neutral-600">{label}</div>
    </div>
  );
}

