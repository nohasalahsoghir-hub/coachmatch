import { redirect } from "next/navigation";
import { Wallet, Users, Star, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityToggle } from "@/components/coach/AvailabilityToggle";
import { BookingRow } from "@/components/coach/BookingRow";

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: coach } = await supabase
    .from("coaches")
    .select("is_available_today, rating, total_reviews")
    .eq("id", user.id)
    .single();
  if (!coach) redirect("/auth/login"); // not a coach account

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: todaysBookings } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, location, status, athlete_id, profiles:profiles!bookings_athlete_id_fkey(full_name, phone)")
    .eq("coach_id", user.id)
    .eq("session_date", today)
    .order("start_time");

  const { data: weekBookings } = await supabase
    .from("bookings")
    .select("coach_net, status, athlete_id, created_at")
    .eq("coach_id", user.id)
    .eq("status", "completed")
    .gte("created_at", weekAgo);

  const weeklyPayout = (weekBookings ?? []).reduce((sum, b) => sum + Number(b.coach_net), 0);
  const activeTrainees = new Set((weekBookings ?? []).map((b) => b.athlete_id)).size;

  const schedule = (todaysBookings ?? []).map((b) => ({
    id: b.id,
    start_time: b.start_time,
    end_time: b.end_time,
    location: b.location,
    status: b.status,
    athleteName: (b as any).profiles?.full_name ?? "متدرب",
    athletePhone: (b as any).profiles?.phone ?? "",
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">لوحة المدرب</h1>
        <AvailabilityToggle initial={coach.is_available_today} />
      </div>

      <div className="rounded-2xl bg-gradient-to-l from-emerald-600 to-emerald-700 p-4">
        <div className="flex items-center gap-2 text-sm text-emerald-100">
          <Banknote size={16} />
          ملخص التحويل الأسبوعي (InstaPay)
        </div>
        <p className="mt-1 text-2xl font-extrabold">{weeklyPayout.toFixed(2)} ج.م</p>
        <p className="text-xs text-emerald-100">يُحوَّل كل أسبوع على رقم الـ InstaPay المسجّل</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Wallet} label="أرباح الأسبوع" value={`${weeklyPayout.toFixed(0)} ج.م`} />
        <StatCard icon={Users} label="متدربين نشطين" value={String(activeTrainees)} />
        <StatCard icon={Star} label="التقييم" value={coach.rating.toFixed(1)} />
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-neutral-300">جدول اليوم</h2>
        {schedule.length === 0 ? (
          <p className="rounded-xl bg-neutral-900 p-4 text-center text-sm text-neutral-500">
            مفيش حجوزات النهاردة
          </p>
        ) : (
          <div className="space-y-2">
            {schedule.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-neutral-900 p-3 text-center">
      <Icon size={18} className="mx-auto mb-1 text-emerald-400" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-neutral-500">{label}</p>
    </div>
  );
}
