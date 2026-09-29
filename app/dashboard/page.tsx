import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Clock3, MessageCircle, PackageOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedCoaches } from "@/lib/marketplace";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BookingActions } from "@/components/athlete/BookingActions";
import { ReviewForm } from "@/components/athlete/ReviewForm";

export default async function Dashboard() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { data: profile },
    { data: bookings },
    { data: packages },
    { data: notifications },
    suggested,
  ] = await Promise.all([
    s.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
    s
      .from("bookings")
      .select("id, coach_id, session_date, start_time, end_time, location, status, total_amount, package_id, reference_code")
      .eq("athlete_id", user.id)
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(12),
    s
      .from("athlete_packages")
      .select("id, total_sessions, remaining_sessions, status, expires_at")
      .eq("athlete_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(4),
    s
      .from("notifications")
      .select("id, title, body, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    getVerifiedCoaches({}, 4),
  ]);

  if (profile?.role === "coach") redirect("/coach/dashboard");

  const ids = [...new Set((bookings ?? []).map((b: any) => b.coach_id))];
  const { data: coachRows } = ids.length
    ? await s.from("coach_public_catalog").select("id, full_name").in("id", ids)
    : { data: [] };

  const coachMap = new Map((coachRows ?? []).map((c: any) => [c.id, c.full_name]));
  const upcoming = (bookings ?? []).find((b: any) => ["pending", "confirmed"].includes(b.status));

  return (
    <div className="space-y-7 pb-20">
      {/* Header */}
      <section className="rounded-[2.5rem] border border-white/10 bg-[var(--surface)] p-6">
        <p className="text-xs font-bold text-amber-300">مساحتي</p>
        <h1 className="mt-2 text-3xl font-black text-white">أهلاً {profile?.full_name ?? ""} 👋</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">كل مواعيدك وباقاتك وتنبيهاتك في مكان واحد.</p>
      </section>

      {/* Upcoming / Next booking */}
      {upcoming ? (
        <section
          className={`rounded-[2.5rem] p-6 text-white ${
            upcoming.status === "pending"
              ? "border border-amber-400/30 bg-amber-400/10 text-amber-200"
              : "bg-[var(--flare)] text-[#1a0800]"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-black">
            <span className="opacity-80">
              {upcoming.status === "pending" ? "طلب حجز بانتظار تأكيد التحويل" : "أقرب موعد مؤكد"}
            </span>
            {upcoming.reference_code && (
              <span className="font-mono bg-black/20 px-2 py-0.5 rounded-lg text-[11px]">
                {upcoming.reference_code}
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-black">
            {coachMap.get(upcoming.coach_id) ?? "المدرب"} · {upcoming.session_date}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-bold">
            <span className="inline-flex items-center gap-1">
              <Clock3 size={14} />
              {String(upcoming.start_time).slice(0, 5)}–{String(upcoming.end_time).slice(0, 5)}
            </span>
            <span>{upcoming.location}</span>
            <StatusBadge status={upcoming.status} />
          </div>

          {upcoming.status === "pending" && (
            <div className="mt-4 pt-3 border-t border-amber-400/20">
              <Link
                href={`/checkout/${upcoming.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-[#1a0800] hover:bg-amber-300 transition"
              >
                <MessageCircle size={15} />
                <span>إرسال إيصال التحويل عبر WhatsApp</span>
              </Link>
            </div>
          )}
        </section>
      ) : (
        <EmptyState
          title="مفيش حجز جاي"
          text="اكتشف المدربين واختَر موعداً متاحاً."
          href="/coaches"
          label="استعراض المدربين"
        />
      )}

      {/* Bookings List */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">حجوزاتي</h2>
          <span className="text-xs text-[var(--muted-2)]">{bookings?.length ?? 0} عملية</span>
        </div>

        {bookings?.length ? (
          <div className="grid gap-3">
            {bookings.map((b: any) => (
              <div key={b.id} className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-white flex items-center gap-2">
                      <span>{coachMap.get(b.coach_id) ?? "مدرب"}</span>
                      {b.reference_code && (
                        <span className="font-mono text-[11px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-lg">
                          {b.reference_code}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--muted)]">
                      <span>{b.session_date}</span>
                      <span>
                        {String(b.start_time).slice(0, 5)}–{String(b.end_time).slice(0, 5)}
                      </span>
                      <span>{b.location}</span>
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs border-t border-white/5 pt-2">
                  <span className="font-bold text-white">
                    {b.package_id
                      ? "تم استخدام حصة من الباقة"
                      : `${Number(b.total_amount ?? 0).toLocaleString("ar-EG")} ج.م`}
                  </span>

                  {b.status === "pending" && (
                    <Link
                      href={`/checkout/${b.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:underline"
                    >
                      <MessageCircle size={14} />
                      <span>إرسال الإيصال عبر WhatsApp</span>
                    </Link>
                  )}
                </div>

                <BookingActions bookingId={b.id} status={b.status} />
                {b.status === "completed" && <ReviewForm bookingId={b.id} coachId={b.coach_id} />}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="لسه مفيش حجوزات"
            text="اكتشف المدربين واختَر موعداً متاحاً."
            href="/coaches"
            label="استعراض المدربين"
          />
        )}
      </section>

      {/* Active Packages */}
      {packages?.length ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <PackageOpen size={18} className="text-amber-300" />
            <h2 className="text-xl font-black text-white">باقاتك</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {packages.map((p: any) => (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
                <div className="flex justify-between text-sm font-bold text-white">
                  <span>{p.total_sessions} حصص</span>
                  <span className="text-amber-300">{p.remaining_sessions} متبقية</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/6">
                  <div
                    className="h-2 rounded-full bg-[var(--flare)]"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, ((p.total_sessions - p.remaining_sessions) / p.total_sessions) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-[var(--muted-2)]">
                  تنتهي في {new Date(p.expires_at).toLocaleDateString("ar-EG")}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Suggested Coaches */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-black text-white">مدربين مقترحين</h2>
            <p className="mt-1 text-xs text-[var(--muted-2)]">من نفس الكتالوج العام</p>
          </div>
          <Link href="/coaches" className="text-xs font-bold text-amber-300">
            عرض الكل
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {suggested.map((c: any) => (
            <Link
              key={c.id}
              href={`/coaches/${c.id}`}
              className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4 hover:border-white/25 transition"
            >
              <div className="font-extrabold text-white">{c.full_name}</div>
              <p className="mt-1 text-xs text-[#82968d]">{c.headline}</p>
              <div className="mt-3 flex justify-between text-xs">
                <span className="text-amber-300">
                  ★ {Number(c.rating).toFixed(1)} · {Number(c.available_today_slots ?? 0)} مواعيد اليوم
                </span>
                <span className="font-bold text-white">{Number(c.session_rate).toLocaleString("ar-EG")} ج.م</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Bell size={18} className="text-amber-300" />
          <h2 className="text-xl font-black text-white">آخر الإشعارات</h2>
        </div>
        {notifications?.length ? (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div key={n.id} className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4">
                <div className="text-sm font-bold text-white">{n.title}</div>
                <p className="mt-1 text-xs leading-5 text-[var(--muted-2)]">{n.body}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-[var(--surface)] p-5 text-sm text-[var(--muted-2)]">
            مفيش إشعارات جديدة.
          </p>
        )}
      </section>
    </div>
  );
}
