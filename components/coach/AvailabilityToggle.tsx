"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleOff } from "lucide-react";
import { setCoachAvailability } from "@/lib/actions/coach";

export function AvailabilityToggle({ initial }: { initial: boolean }) {
  const [available, setAvailable] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !available;
    setAvailable(next);
    startTransition(async () => {
      try {
        await setCoachAvailability(next);
      } catch {
        setAvailable(!next);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={available}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-extrabold transition disabled:opacity-60 ${
        available
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : "border-neutral-700 bg-neutral-950 text-neutral-500"
      }`}
    >
      {available ? <CheckCircle2 size={15} /> : <CircleOff size={15} />}
      {available ? "متاح اليوم" : "غير متاح اليوم"}
    </button>
  );
}
