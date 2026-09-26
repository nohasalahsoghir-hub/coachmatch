"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/actions/bookings";
import { purchasePackage } from "@/lib/actions/packages";

type Props = {
  coachId: string;
  sessionRate: number;
  packageRate: number;
  locations: string[];
};

export function BookingForm({ coachId, sessionRate, packageRate, locations }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState(locations[0] ?? "");

  function endTimeOf(start: string) {
    const [h, m] = start.split(":").map(Number);
    const d = new Date();
    d.setHours(h + 1, m);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function bookSingle() {
    setError(null);
    if (!date || !time) return setError("اختار التاريخ والوقت");
    startTransition(async () => {
      try {
        await createBooking({
          coachId,
          sessionDate: date,
          startTime: time,
          endTime: endTimeOf(time),
          location,
        });
        router.push("/dashboard");
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  function buyPackage() {
    setError(null);
    startTransition(async () => {
      try {
        await purchasePackage(coachId);
        router.push("/dashboard");
      } catch (e: any) {
        setError(e.message);
      }
    });
  }

  return (
    <div className="space-y-4 rounded-xl bg-neutral-900 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-neutral-400">التاريخ</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-400">الوقت</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-sm text-white"
          />
        </div>
      </div>

      {locations.length > 0 && (
        <div>
          <label className="text-xs text-neutral-400">المكان</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-2 py-2 text-sm text-white"
          >
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={bookSingle}
          disabled={pending}
          className="rounded-lg bg-emerald-600 py-2.5 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "جارٍ الحجز..." : `احجز حصة واحدة — ${sessionRate + 10} ج.م`}
        </button>
        <button
          onClick={buyPackage}
          disabled={pending}
          className="rounded-lg border border-emerald-600 py-2.5 font-semibold text-emerald-400 hover:bg-emerald-600/10 disabled:opacity-50"
        >
          اشترِ باقة 8 حصص — {packageRate + 10} ج.م
        </button>
      </div>
    </div>
  );
}
