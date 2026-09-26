"use client";

import { useState, useTransition } from "react";
import { toggleAvailability } from "@/lib/actions/packages";

export function AvailabilityToggle({ initial }: { initial: boolean }) {
  const [available, setAvailable] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          setAvailable((v) => !v);
          await toggleAvailability(available);
        })
      }
      disabled={pending}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        available ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${available ? "bg-white" : "bg-neutral-500"}`} />
      {available ? "متاح اليوم" : "غير متاح اليوم"}
    </button>
  );
}
