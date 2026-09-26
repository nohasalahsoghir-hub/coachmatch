"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, Clock3, CreditCard, MapPin, Package, ShieldCheck } from "lucide-react";
import { createDemoBooking, purchaseDemoPackage } from "@/lib/actions/demo";
import type { AvailabilityDay } from "@/lib/demo";

type Props = { coachId: string; sessionRate: number; packageRate: number; locations: string[]; availability: AvailabilityDay[] };

export function DemoBookingForm({ coachId, sessionRate, packageRate, locations, availability }: Props) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<1|2|3>(1);
  const [date, setDate] = useState(availability[0]?.date ?? "");
  const [time, setTime] = useState(availability[0]?.slots[0] ?? "");
  const [location, setLocation] = useState(locations[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [kind, setKind] = useState<"session"|"package">("session");
  const selectedDay = useMemo(() => availability.find((d) => d.date === date), [availability, date]);
  const singleTotal = sessionRate + 10;
  const packageTotal = packageRate + 10;

  useEffect(() => {
    const day = availability.find((d) => d.date === date) ?? availability[0];
    if (!day) return;
    if (day.date !== date) setDate(day.date);
    if (!day.slots.includes(time)) setTime(day.slots[0] ?? "");
  }, [availability, date, time]);

  const paySession = () => {
    setKind("session"); setError(null);
    if (!date || !time || !location) { setError("اختاري اليوم والميعاد والمكان أولًا"); return; }
    const key = `demo-session-${crypto.randomUUID()}`;
    startTransition(async () => { try { const row = await createDemoBooking({ coachId, sessionDate: date, startTime: time, location, idempotencyKey: key }); setReference(row.reference); setStep(3); } catch (e) { setError(e instanceof Error ? e.message : "تعذر إتمام الدفع التجريبي"); } });
  };
  const payPackage = () => {
    setKind("package"); setError(null);
    const key = `demo-package-${crypto.randomUUID()}`;
    startTransition(async () => { try { const row = await purchaseDemoPackage(coachId, key); setReference(row.reference); setStep(3); } catch (e) { setError(e instanceof Error ? e.message : "تعذر إنشاء الباقة التجريبية"); } });
  };

  return <div className="rounded-[2rem] border border-neutral-800 bg-neutral-900 p-4">
    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">{["الموعد","المراجعة","التأكيد"].map((x,i)=><div key={x} className={`rounded-xl px-2 py-2 text-center ${step>=i+1?"bg-emerald-500/10 text-emerald-300":"bg-neutral-800 text-neutral-600"}`}>{i+1}. {x}</div>)}</div>
    {step===1 && <div className="mt-4 space-y-4">
      {availability.length===0 ? <div className="rounded-2xl border border-dashed border-neutral-700 p-6 text-center text-sm text-neutral-500">مفيش مواعيد متاحة خلال الـ14 يوم الجايين للمدرب ده.</div> : <>
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-neutral-300"><CalendarDays size={14}/>اختاري اليوم</div><div className="flex gap-2 overflow-x-auto pb-1">{availability.slice(0,7).map((d)=><button key={d.date} type="button" onClick={()=>{setDate(d.date);setTime(d.slots[0] ?? "");}} className={`min-w-28 rounded-2xl border px-3 py-3 text-right ${date===d.date?"border-emerald-500 bg-emerald-600 text-white":"border-neutral-700 bg-neutral-950 text-neutral-400"}`}><div className="text-xs font-extrabold">{d.label}</div><div className="mt-1 text-[10px] opacity-75">{d.slots.length} مواعيد</div></button>)}</div></div>
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold text-neutral-300"><Clock3 size={14}/>المواعيد المتاحة</div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{(selectedDay?.slots ?? []).map((s)=><button key={s} type="button" onClick={()=>setTime(s)} className={`min-h-11 rounded-xl border text-sm font-bold ${time===s?"border-emerald-500 bg-emerald-600 text-white":"border-neutral-700 bg-neutral-950 text-neutral-400"}`}>{s}</button>)}</div></div>
        <label className="block space-y-1.5 text-xs text-neutral-400">مكان التدريب<select value={location} onChange={(e)=>setLocation(e.target.value)} className="min-h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-white"><option value="">اختاري المكان</option>{locations.map((l)=><option key={l} value={l}>{l}</option>)}</select></label>
        <button type="button" disabled={!time || !location} onClick={()=>setStep(2)} className="min-h-12 w-full rounded-xl bg-emerald-600 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-40">مراجعة الطلب</button>
      </>}
    </div>}
    {step===2 && <div className="mt-4 space-y-3">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"><div className="flex items-center justify-between text-sm"><span className="text-neutral-500">الخدمة</span><span>{kind==="session"?"حصة واحدة":"باقة 8 حصص"}</span></div>{kind==="session"?<><Row label="سعر الحصة" value={`${sessionRate} ج.م`}/><Row label="رسوم تشغيل" value="10 ج.م"/><Row label="الإجمالي" value={`${singleTotal} ج.م`} strong/></>:<><Row label="سعر الباقة" value={`${packageRate} ج.م`}/><Row label="رسوم تشغيل" value="10 ج.م"/><Row label="الإجمالي" value={`${packageTotal} ج.م`} strong/></>}</div>
      <div className="rounded-2xl bg-emerald-500/5 p-3 text-xs leading-5 text-emerald-200"><ShieldCheck size={14} className="ml-1 inline"/> الدفع ده تجريبي فقط؛ لا يتم خصم أموال حقيقية.</div>
      {kind==="session" && <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-500"><span className="rounded-xl bg-neutral-950 p-2"><CalendarDays size={12} className="ml-1 inline"/>{date}</span><span className="rounded-xl bg-neutral-950 p-2"><Clock3 size={12} className="ml-1 inline"/>{time}</span><span className="rounded-xl bg-neutral-950 p-2"><MapPin size={12} className="ml-1 inline"/>{location}</span></div>}
      <div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={pending} onClick={paySession} className="min-h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-extrabold disabled:opacity-50"><CreditCard size={16}/>دفع حصة — {singleTotal} ج.م</button><button type="button" disabled={pending} onClick={payPackage} className="min-h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 text-sm font-bold text-emerald-300 disabled:opacity-50"><Package size={16}/>شراء باقة — {packageTotal} ج.م</button></div>
      <button type="button" disabled={pending} onClick={()=>{setError(null);setStep(1)}} className="min-h-11 inline-flex w-full items-center justify-center gap-1 text-xs text-neutral-500">رجوع <ChevronLeft size={14}/></button>{error&&<p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
    </div>}
    {step===3 && <div className="py-8 text-center"><CheckCircle2 size={56} className="mx-auto text-emerald-400"/><p className="mt-4 text-xl font-extrabold">تم {kind==="session"?"تأكيد الحجز":"تفعيل الباقة"}</p><p className="mt-2 text-sm leading-6 text-neutral-500">العملية تجريبية بالكامل، وتم تسجيلها داخل بيانات العرض.</p><div className="mx-auto mt-4 max-w-xs rounded-xl bg-neutral-950 p-3 font-mono text-xs text-emerald-300">{reference}</div><a href={kind==="session"?"/demo/athlete":"/demo/athlete"} className="mt-5 block min-h-12 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold">فتح لوحة المتدرب</a></div>}
  </div>
}
function Row({label,value,strong=false}:{label:string;value:string;strong?:boolean}){return <div className={`mt-2 flex items-center justify-between ${strong?"border-t border-neutral-800 pt-3 text-base font-extrabold":"text-sm"}`}><span className="text-neutral-500">{label}</span><span className={strong?"text-emerald-300":""}>{value}</span></div>}
