import { MessageCircle, MapPin, Clock } from "lucide-react";
import { ConfirmAttendanceButton } from "@/components/coach/ConfirmAttendanceButton";

type Props = {
  booking: {
    id: string;
    start_time: string;
    end_time: string;
    location: string;
    status: string;
    athleteName: string;
    athletePhone: string;
  };
};

export function BookingRow({ booking }: Props) {
  const waLink = `https://wa.me/2${booking.athletePhone.replace(/^0/, "")}`;

  return (
    <div className="flex items-center justify-between rounded-xl bg-neutral-900 p-3">
      <div>
        <p className="font-semibold">{booking.athleteName}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {booking.start_time.slice(0, 5)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {booking.location}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-neutral-800 p-2 text-emerald-400 hover:bg-neutral-700"
          aria-label="واتساب"
        >
          <MessageCircle size={16} />
        </a>
        {booking.status === "confirmed" ? (
          <ConfirmAttendanceButton bookingId={booking.id} />
        ) : (
          <span className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-400">
            {booking.status === "completed" ? "تم ✅" : booking.status}
          </span>
        )}
      </div>
    </div>
  );
}
