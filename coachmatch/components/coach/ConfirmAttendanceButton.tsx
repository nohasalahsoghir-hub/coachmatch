"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { confirmAttendance } from "@/lib/actions/bookings";

export function ConfirmAttendanceButton({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => confirmAttendance(bookingId))}
      disabled={pending}
      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
    >
      <CheckCircle2 size={14} />
      {pending ? "..." : "تأكيد الحضور"}
    </button>
  );
}
