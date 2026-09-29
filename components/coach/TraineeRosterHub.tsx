"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  MessageCircle,
  Package,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { formatWhatsAppNumber } from "@/components/coach/BookingRow";

export interface TraineeItem {
  athleteId: string;
  athleteName: string;
  athletePhone: string;
  packageId?: string | null;
  totalSessions: number;
  remainingSessions: number;
  packageStatus: string;
  expiresAt?: string | null;
  lastSessionDate?: string | null;
  nextSessionDate?: string | null;
  totalBookingsCompleted: number;
}

export function TraineeRosterHub({ trainees }: { trainees: TraineeItem[] }) {
  const [filter, setFilter] = useState<"all" | "active_packages" | "expiring_soon">("all");
  const [search, setSearch] = useState("");

  // Expiring or exhausted packages (1 or 0 sessions remaining)
  const expiringCount = useMemo(
    () => trainees.filter((t) => t.packageId && t.remainingSessions <= 1).length,
    [trainees]
  );

  const activePackagesCount = useMemo(
    () => trainees.filter((t) => t.packageId && t.remainingSessions > 0).length,
    [trainees]
  );

  const filtered = useMemo(() => {
    return trainees.filter((t) => {
      // Tab filter
      if (filter === "active_packages" && (!t.packageId || t.remainingSessions <= 0)) return false;
      if (filter === "expiring_soon" && (!t.packageId || t.remainingSessions > 1)) return false;

      // Text search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = (t.athleteName || "").toLowerCase().includes(q);
        const matchesPhone = (t.athletePhone || "").includes(q);
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [trainees, filter, search]);

  const makeWhatsAppUrl = (phone: string, name: string, remaining: number, hasPackage: boolean) => {
    const waNum = formatWhatsAppNumber(phone);
    if (!waNum) return "";

    let msg = "";
    if (hasPackage && remaining === 0) {
      msg = `أهلاً يا ${name} 👋 حبيت أطمن عليك، باقتك التدريبية السابقة اكتملت بالكامل. تحب ننسق ونجدد باقة الشهر الجديد ونحجز مواعيدك المفضلة قبل ما تكتمل المواعيد؟ 💪`;
    } else if (hasPackage && remaining === 1) {
      msg = `أهلاً يا ${name} 👋 حبيت أفكرك إنه متبقي لك آخر حصة تدريبية في باقتك الحالية. تحب ننسق باقة التجديد ونضمن جدولك للشهر القادم؟ 💪`;
    } else if (hasPackage && remaining > 1) {
      msg = `أهلاً يا ${name} 👋 متابع معاك تمرينك، متبقي لك ${remaining} حصص في باقتك الحالية. جاهز للحصة الجاية؟ 💪`;
    } else {
      msg = `أهلاً يا ${name} 👋 بتمنى تمرينك يكون ماشي ممتاز، تحب نحجز جلسة تدريب جديدة هذا الأسبوع؟ 💪`;
    }
    return `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-4">
      {/* Smart Renewal Alert Banner if any package is expiring or exhausted */}
      {expiringCount > 0 && (
        <div className="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400/20 text-amber-300">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-amber-200">
                  تنبيه تجديد باقة ({expiringCount} متدربين متبقي لهم حصة واحدة أو انتهت باقتهم)
                </h4>
                <p className="mt-0.5 text-xs text-amber-100/80 leading-5">
                  تواصل معهم الآن لتأكيد اشتراك الشهر الجديد وحجز مواعيدهم قبل أن يملأ متدربون آخرون أوقاتك الشاغرة.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilter("expiring_soon")}
              className="shrink-0 min-h-11 rounded-xl bg-amber-400 px-4 text-xs font-black text-black transition hover:bg-amber-300 shadow-md shadow-amber-400/20 active:scale-[0.98]"
            >
              عرض المتدربين للتجديد ({expiringCount})
            </button>
          </div>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-[var(--surface-2)] p-1 border border-[var(--line-soft)]">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`min-h-11 rounded-xl px-4 text-xs font-bold transition flex items-center gap-1.5 ${
              filter === "all"
                ? "bg-[var(--cobalt)] text-white shadow-md shadow-[var(--cobalt)]/25"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            <span>كل المتدربين</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] tabular font-mono">
              {trainees.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("active_packages")}
            className={`min-h-11 rounded-xl px-4 text-xs font-bold transition flex items-center gap-1.5 ${
              filter === "active_packages"
                ? "bg-[var(--cobalt)] text-white shadow-md shadow-[var(--cobalt)]/25"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            <Package size={13} />
            <span>أصحاب الباقات</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] tabular font-mono">
              {activePackagesCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("expiring_soon")}
            className={`min-h-11 rounded-xl px-4 text-xs font-bold transition flex items-center gap-1.5 ${
              filter === "expiring_soon"
                ? "bg-amber-400 text-black shadow-md shadow-amber-400/25 font-black"
                : "text-amber-300 hover:text-amber-200"
            }`}
          >
            <AlertTriangle size={13} />
            <span>تحتاج تجديد</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.5 text-[10px] tabular font-mono">
              {expiringCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute right-3.5 top-3.5 text-[var(--muted-2)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] pr-10 pl-3 text-xs text-[var(--text)] outline-none transition focus:border-[var(--cobalt)]"
          />
        </div>
      </div>

      {/* Trainees Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((t) => {
            const completedCount = t.totalSessions - t.remainingSessions;
            const pct =
              t.totalSessions > 0
                ? Math.min(100, Math.max(0, Math.round((completedCount / t.totalSessions) * 100)))
                : 100;
            const waUrl = makeWhatsAppUrl(
              t.athletePhone,
              t.athleteName,
              t.remainingSessions,
              Boolean(t.packageId)
            );

            return (
              <div
                key={t.athleteId}
                className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--cobalt)]/40"
              >
                {/* Header: Name, Phone, and WhatsApp */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[rgba(62,111,242,0.12)] text-base font-black text-cobalt-300">
                      {t.athleteName.slice(0, 1) || "م"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[var(--text)]">{t.athleteName}</h4>
                      {t.athletePhone && !t.athletePhone.startsWith("seed-") ? (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted-2)] font-mono" dir="ltr">
                          <Phone size={11} />
                          <span>{t.athletePhone}</span>
                        </div>
                      ) : (
                        <span className="mt-1 text-[11px] text-[var(--muted-2)] block">متدرب مسجل حديثاً</span>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp Quick Message Button */}
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 shadow-sm"
                      title="مراسلة سريعة عبر واتساب"
                      aria-label={`مراسلة ${t.athleteName} عبر واتساب`}
                    >
                      <MessageCircle size={15} />
                      <span className="hidden sm:inline">واتساب</span>
                    </a>
                  )}
                </div>

                {/* Package Progress Section */}
                <div className="mt-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-bold text-[var(--muted)]">
                      <Package size={13} className="text-[var(--cobalt)]" />
                      {t.packageId ? "باقة تدريب 8 حصص" : "حجز جلسات فردية"}
                    </span>
                    {t.packageId ? (
                      t.remainingSessions === 0 ? (
                        <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-[10px] font-black text-rose-300">
                          اكتملت (تحتاج تجديد)
                        </span>
                      ) : t.remainingSessions === 1 ? (
                        <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-black text-amber-300 animate-pulse">
                          متبقي حصة واحدة (تجديد)
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
                          متبقي {t.remainingSessions} حصص
                        </span>
                      )
                    ) : (
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-[var(--muted-2)]">
                        {t.totalBookingsCompleted} جلسات منجزة
                      </span>
                    )}
                  </div>

                  {/* Progress Bar for Package */}
                  {t.packageId && (
                    <div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            t.remainingSessions <= 1
                              ? "bg-amber-400"
                              : "bg-[var(--cobalt)]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-[10px] text-[var(--muted-2)] font-mono">
                        <span>أُنجز {completedCount} من {t.totalSessions} حصة</span>
                        <span>معدل الإنجاز {pct}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Session Lifecycle Footnote */}
                <div className="mt-3.5 flex items-center justify-between text-[11px] text-[var(--muted-2)] pt-2.5 border-t border-[var(--line-soft)]">
                  <span className="inline-flex items-center gap-1">
                    <CalendarCheck size={12} className="text-cobalt-300" />
                    <span>الجلسات المنجزة: <b className="text-[var(--text)] font-mono">{t.totalBookingsCompleted}</b></span>
                  </span>
                  {t.nextSessionDate ? (
                    <span className="text-emerald-400 font-bold font-mono">
                      القادم: {t.nextSessionDate}
                    </span>
                  ) : (
                    <span className="text-[var(--muted-2)]">لا يوجد موعد قادم</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted-2)]">
            <Users size={22} />
          </div>
          <h4 className="mt-3 text-sm font-black text-[var(--text)]">لا يوجد متدربين في هذا التصنيف</h4>
          <p className="mt-1 text-xs text-[var(--muted-2)]">
            يمكنك مسح الفلتر أو كلمة البحث لعرض كافة المتدربين المسجلين معك.
          </p>
          {(filter !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setSearch("");
              }}
              className="mt-3.5 inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line)] px-4 text-xs font-bold text-cobalt-300 hover:bg-white/5 transition"
            >
              عرض كل المتدربين
            </button>
          )}
        </div>
      )}
    </div>
  );
}
