"use client";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays,Clock3,MapPin,Package,ShieldCheck } from "lucide-react";
import { bookWithPackage,createCheckoutIntent } from "@/lib/actions/bookings";
import type { AvailabilityDay } from "@/lib/marketplace";

type Props={coachId:string;sessionRate:number;packageRate:number;locations:string[];availability:AvailabilityDay[];packageId?:string|null;packageRemaining?:number};
export function BookingForm({coachId,sessionRate,packageRate,locations,availability,packageId=null,packageRemaining=0}:Props){
  const router=useRouter();
  const[pending,start]=useTransition();
  const[date,setDate]=useState(availability[0]?.date??"");
  const[time,setTime]=useState(availability[0]?.slots[0]??"");
  const[location,setLocation]=useState(locations[0]??"");
  const[error,setError]=useState<string|null>(null);
  const[newCheckoutKey,setNewCheckoutKey]=useState(()=>`checkout-${crypto.randomUUID()}`);
  const[newPackageKey,setNewPackageKey]=useState(()=>`package-book-${crypto.randomUUID()}`);
  const selected=availability.find(x=>x.date===date);
  const chooseDate=(nextDate:string,nextSlots:string[])=>{setDate(nextDate);setTime(nextSlots[0]??"");setNewCheckoutKey(`checkout-${crypto.randomUUID()}`);setNewPackageKey(`package-book-${crypto.randomUUID()}`);setError(null)};
  const chooseTime=(nextTime:string)=>{setTime(nextTime);setNewCheckoutKey(`checkout-${crypto.randomUUID()}`);setNewPackageKey(`package-book-${crypto.randomUUID()}`);setError(null)};
  const chooseLocation=(nextLocation:string)=>{setLocation(nextLocation);setNewCheckoutKey(`checkout-${crypto.randomUUID()}`);setNewPackageKey(`package-book-${crypto.randomUUID()}`);setError(null)};
  const book=()=>{setError(null);if(!date||!time||!location){setError("اختاري اليوم والميعاد والمكان.");return}start(async()=>{try{const r=await createCheckoutIntent({coachId,sessionDate:date,startTime:time,location,idempotencyKey:newCheckoutKey});router.push(`/checkout/${r.intent_id}`)}catch(e){setError(e instanceof Error?e.message:"تعذر بدء الحجز")}})};
  const usePackage=()=>{setError(null);if(!packageId||!date||!time||!location){setError("اختاري اليوم والميعاد والمكان.");return}start(async()=>{try{await bookWithPackage({packageId,coachId,sessionDate:date,startTime:time,location,idempotencyKey:newPackageKey});router.push("/dashboard?packageBooking=success")}catch(e){setError(e instanceof Error?e.message:"تعذر حجز الحصة من الباقة")}})};
  return <div className="rounded-[2rem] border border-white/7 bg-[#0b1713] p-5">
    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300"><ShieldCheck size={15}/>المواعيد المعروضة متاحة للحجز الآن</div>
    {!availability.length?<div className="mt-5 rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-[#73877e]">لا توجد مواعيد متاحة خلال الفترة الحالية.</div>:<>
      <div className="mt-5"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#b3c0bb]"><CalendarDays size={14}/>اختاري اليوم</div><div className="flex gap-2 overflow-x-auto pb-1">{availability.slice(0,7).map(d=><button key={d.date} type="button" onClick={()=>chooseDate(d.date,d.slots)} className={`min-w-28 min-h-16 rounded-2xl border px-3 text-right ${date===d.date?"border-emerald-400 bg-emerald-400 text-[#052117]":"border-white/7 bg-[#07110e] text-[#84988f]"}`}><div className="text-xs font-extrabold">{d.label}</div><div className="mt-1 text-[10px] opacity-75">{d.slots.length} مواعيد</div></button>)}</div></div>
      <div className="mt-5"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#b3c0bb]"><Clock3 size={14}/>اختاري الموعد</div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{selected?.slots.map(s=><button type="button" key={s} onClick={()=>chooseTime(s)} className={`min-h-11 rounded-xl border text-xs font-black ${time===s?"border-emerald-400 bg-emerald-400 text-[#052117]":"border-white/7 bg-[#07110e] text-[#91a49b]"}`}>{s}</button>)}</div></div>
      <label className="mt-5 block text-xs text-[#82968d]">مكان التدريب<select value={location} onChange={e=>chooseLocation(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/8 bg-[#07110e] px-3 text-sm text-white">{locations.map(l=><option key={l} value={l}>{l}</option>)}</select></label>
      <div className="mt-5 rounded-2xl bg-[#07110e] p-4"><div className="flex justify-between text-sm"><span className="text-[#73877e]">سعر الجلسة</span><b>{sessionRate.toLocaleString("ar-EG")} ج.م</b></div><div className="mt-2 text-xs text-[#60756b]">رسوم التشغيل 10 ج.م تظهر في المراجعة قبل الدفع.</div></div>
      {packageId&&packageRemaining>0&&<div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4"><div className="flex items-center gap-2 text-sm font-black text-emerald-200"><Package size={15}/>عندك باقة فعالة</div><p className="mt-1 text-xs text-[#8aa098]">متبقي {packageRemaining} حصص. استخدمي حصة لهذا الموعد بدون دفع جديد.</p><button type="button" disabled={pending} onClick={usePackage} className="mt-3 min-h-11 w-full rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-xs font-black text-emerald-200 disabled:opacity-50">استخدام حصة من الباقة</button></div>}
      <button type="button" disabled={pending} onClick={book} className="mt-4 min-h-12 w-full rounded-xl bg-emerald-400 text-sm font-black text-[#052117] disabled:opacity-50">{pending?"جاري تجهيز الحجز...":"المتابعة للدفع"}</button>
      <button type="button" disabled={pending} onClick={()=>router.push(`/checkout/package/${coachId}`)} className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/20 text-xs font-bold text-emerald-200 disabled:opacity-50"><Package size={15}/>شراء باقة 8 حصص — {packageRate.toLocaleString("ar-EG")} ج.م</button>
      {error&&<p role="alert" className="mt-3 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}
      <p className="mt-3 text-center text-[10px] text-[#5e736a]"><MapPin size={11} className="ml-1 inline"/> الموعد لا يُثبت قبل اكتمال الدفع أو استخدام حصة من باقة فعالة.</p>
    </>}</div>
}
