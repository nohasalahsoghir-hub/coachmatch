"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function CoachFilters({ sports, locations }: { sports: { slug: string; name_ar: string }[]; locations: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(params.get("q") ?? "");
  const update = (key: string, value: string) => {
    const p = new URLSearchParams(params);
    if (!value || value === "all") p.delete(key); else p.set(key, value);
    p.delete("page");
    router.push(p.toString() ? `/coaches?${p}` : "/coaches");
  };
  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); update("q", q.trim()); };
  const activeFilters = ["sport", "location", "maxRate", "available"].filter((x) => params.get(x)).length;
  return (
    <div className="space-y-3 rounded-3xl border border-neutral-800 bg-neutral-900 p-3">
      <div className="flex gap-2">
        <form onSubmit={submitSearch} className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-950 px-3 py-2.5">
          <Search size={17} className="shrink-0 text-neutral-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم المدرب أو التخصص" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-600" aria-label="البحث عن مدرب" />
        </form>
        <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-neutral-700 px-4 text-xs font-bold text-neutral-300" aria-expanded={open}>
          <SlidersHorizontal size={16} /> تصفية {activeFilters ? `(${activeFilters})` : ""}
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => update("sport", "all")} className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-bold ${!params.get("sport") ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"}`}>كل الرياضات</button>
        {sports.slice(0, 8).map((sport) => <button key={sport.slug} onClick={() => update("sport", sport.slug)} className={`min-h-11 shrink-0 rounded-full px-4 text-xs font-bold ${params.get("sport") === sport.slug ? "bg-emerald-600 text-white" : "bg-neutral-800 text-neutral-400"}`}>{sport.name_ar}</button>)}
      </div>
      {open && (
        <div className="grid gap-3 border-t border-neutral-800 pt-3 sm:grid-cols-3">
          <label className="space-y-1.5 text-xs text-neutral-400">المكان<select value={params.get("location") ?? ""} onChange={(e) => update("location", e.target.value)} className="min-h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-white outline-none"><option value="">كل الأماكن</option>{locations.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
          <label className="space-y-1.5 text-xs text-neutral-400">أقصى سعر للحصة<select value={params.get("maxRate") ?? ""} onChange={(e) => update("maxRate", e.target.value)} className="min-h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-white outline-none"><option value="">أي سعر</option><option value="200">حتى 200 ج.م</option><option value="250">حتى 250 ج.م</option><option value="300">حتى 300 ج.م</option><option value="400">حتى 400 ج.م</option></select></label>
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-xs text-neutral-300"><input type="checkbox" checked={params.get("available") === "true"} onChange={(e) => update("available", e.target.checked ? "true" : "")} className="h-4 w-4 accent-emerald-500" /> متاح اليوم فقط</label>
          <button type="button" onClick={() => router.push("/coaches")} className="min-h-11 rounded-xl border border-neutral-700 text-xs font-bold text-neutral-400 sm:col-span-3">مسح كل الفلاتر</button>
        </div>
      )}
    </div>
  );
}
