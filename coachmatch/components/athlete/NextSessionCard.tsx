import { MapPin, Clock, CalendarDays } from "lucide-react";

type Props = {
  coachName: string;
  sessionDate: string;
  startTime: string;
  location: string;
  bookingId: string;
};

export function NextSessionCard({ coachName, sessionDate, startTime, location, bookingId }: Props) {
  // QR encodes the booking id; the coach's "confirm attendance" flow can scan
  // this to call confirmAttendance(bookingId) instead of tapping it manually.
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=coachmatch:booking:${bookingId}`;

  return (
    <div className="flex items-center justify-between rounded-2xl bg-gradient-to-l from-neutral-800 to-neutral-900 p-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-emerald-400">جلستك القادمة</p>
        <p className="text-lg font-bold">{coachName}</p>
        <div className="space-y-1 text-sm text-neutral-400">
          <p className="flex items-center gap-1">
            <CalendarDays size={14} /> {sessionDate}
          </p>
          <p className="flex items-center gap-1">
            <Clock size={14} /> {startTime.slice(0, 5)}
          </p>
          <p className="flex items-center gap-1">
            <MapPin size={14} /> {location}
          </p>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt="QR تأكيد الحضور" className="h-24 w-24 rounded-lg bg-white p-1" />
    </div>
  );
}
