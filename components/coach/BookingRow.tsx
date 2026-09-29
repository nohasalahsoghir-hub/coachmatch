import { MessageCircle, MapPin, Clock3, Calendar, Hash } from "lucide-react";
import { ConfirmAttendanceButton } from "@/components/coach/ConfirmAttendanceButton";
import { StatusBadge } from "@/components/shared/StatusBadge";

export interface BookingRowItem {
  id: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  athleteName: string;
  athletePhone?: string;
  session_date?: string;
  referenceCode?: string | null;
}

export function formatWhatsAppNumber(phone?: string): string {
  if (!phone || phone.startsWith("seed-")) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0020")) clean = clean.slice(4);
  else if (clean.startsWith("20")) clean = clean.slice(2);
  else if (clean.startsWith("0")) clean = clean.slice(1);
  return clean.length >= 9 ? `20${clean}` : "";
}

export function isSessionPastEndTime(sessionDate?: string, endTime?: string): boolean {
  if (!sessionDate || !endTime) return false;
  try {
    const cairoNowStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());

    const [cDate, cTime] = cairoNowStr.split(", ");
    const sessionFull = `${sessionDate}T${endTime.slice(0, 5)}:00`;
    const nowFull = `${cDate}T${cTime}`;
    return nowFull >= sessionFull;
  } catch {
    return false;
  }
}

export function BookingRow({ booking }: { booking: BookingRowItem }) {
  const waNum = formatWhatsAppNumber(booking.athletePhone);
  const waLink = waNum
    ? `https://wa.me/${waNum}?text=${encodeURIComponent(
        `أهلاً يا ${booking.athleteName} 👋 بخصوص جلستنا التدريبية يوم ${booking.session_date || "المحدد"} الساعة ${booking.start_time.slice(0, 5)}...`
      )}`
    : "";

  const isPast = isSessionPastEndTime(booking.session_date, booking.end_time);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:border-[var(--line-strong)]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold text-[var(--text)] text-sm">
              {booking.athleteName}
            </span>
            {booking.referenceCode && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-mono text-cobalt-300 border border-[var(--line-soft)]">
                <Hash size={10} />
                {booking.referenceCode}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
            {booking.session_date && (
              <span className="inline-flex items-center gap-1 font-bold text-cobalt-300">
                <Calendar size={13} />
                {booking.session_date}
              </span>
            )}
            <span className="inline-flex items-center gap-1 font-mono">
              <Clock3 size={13} className="text-[var(--muted-2)]" />
              {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} className="text-[var(--muted-2)]" />
              {booking.location}
            </span>
          </div>

          {booking.status === "pending" && (
            <div className="text-[11px] text-amber-300/90 font-medium">
              بانتظار تأكيد تحويل المبلغ من الإدارة عبر واتساب.
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <StatusBadge status={booking.status} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-3">
        <div>
          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`التواصل مع ${booking.athleteName} عبر واتساب`}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20"
              title="مراسلة المتدرب على واتساب"
            >
              <MessageCircle size={15} />
              <span>محادثة واتساب</span>
            </a>
          ) : (
            <span className="text-[11px] text-[var(--muted-2)]">لا يتوفر رقم هاتف</span>
          )}
        </div>

        <div>
          {booking.status === "confirmed" && (
            <ConfirmAttendanceButton
              bookingId={booking.id}
              isPastSession={isPast}
              endTimeLabel={booking.end_time.slice(0, 5)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
