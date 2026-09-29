"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { reviewCoachVerification } from "@/lib/actions/admin";

export function AdminVerificationActions({ requestId }: { requestId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const act = (status: "approved" | "rejected") => {
    let reason = "";
    if (status === "rejected") {
      reason = prompt("يرجى كتابة سبب رفض التوثيق:", "البيانات أو الشهادات غير مكتملة") || "";
      if (!reason) return;
    }
    setError(null);
    start(async () => {
      try {
        await reviewCoachVerification(requestId, status, reason);
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر تحديث الطلب");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[10px] text-rose-300">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => act("rejected")}
        className="inline-flex h-8 items-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 text-[11px] font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
      >
        <X size={12} />
        <span>رفض</span>
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => act("approved")}
        className="inline-flex h-8 items-center gap-1 rounded-xl bg-emerald-500 px-3 text-[11px] font-black text-[#052117] transition hover:bg-emerald-400 disabled:opacity-50"
      >
        <Check size={12} />
        <span>توثيق المدرب</span>
      </button>
    </div>
  );
}
