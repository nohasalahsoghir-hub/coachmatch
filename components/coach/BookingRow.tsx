import { MessageCircle, MapPin, Clock3, Calendar } from "lucide-react";
import { ConfirmAttendanceButton } from "@/components/coach/ConfirmAttendanceButton";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function BookingRow({
  booking,
}: {
  booking: {
    id: string;
    start_time: string;
    end_time: string;
    location: string;
    status: string;
    athleteName: string;
    athletePhone?: string;
    session_date?: string;
  };
}) {
  const phone = (booking.athletePhone ?? "").replace(/\D/g, "").replace(/^0/, "");
  const link = phone ? `https://wa.me/20${phone}` : "";

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:border-[var(--line-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-extrabold text-[var(--text)] text-sm">{booking.athleteName}</div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
            {booking.session_date && (
              <span className="inline-flex items-center gap-1 font-bold text-cobalt-300">
                <Calendar size={13} />
                {booking.session_date}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock3 size={13} className="text-[var(--muted-2)]" />
              {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} className="text-[var(--muted-2)]" />
              {booking.location}
            </span>
          </div>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="التواصل مع المتدرب عبر واتساب"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
            title="مراسلة المتدرب على واتساب"
          >
            <MessageCircle size={16} />
          </a>
        )}
        {booking.status === "confirmed" && <ConfirmAttendanceButton bookingId={booking.id} />}
      </div>
    </div>
  );
}
