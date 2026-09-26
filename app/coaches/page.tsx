import { notFound } from "next/navigation";
import { BadgeCheck, Clock3, Languages, MapPin, ShieldCheck, Star } from "lucide-react";
import { DemoBookingForm } from "@/components/demo/DemoBookingForm";
import { BookingForm } from "@/components/athlete/BookingForm";
import { getCoachById, getDemoAvailability, getDemoCoachReviews, getRealAvailability } from "@/lib/demo";

export default async function CoachDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coach = await getCoachById(id);
  if (!coach) notFound();
  const isDemo = Boolean((coach as any).is_demo);
  const locations = (coach as any).training_locations ?? [];
  const languages = (coach as any).languages ?? [];
  const [availability, reviews] = isDemo ? await Promise.all([getDemoAvailability(id, 14), getDemoCoachReviews(id)]) : [await getRealAvailability(id, 14), []];
  const displayName = ((coach as any).profiles?.full_name ?? "مدرب").replace(/ • .*$/, "");
  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-neutral-800 bg-neutral-900 p-5">
        <div className="flex flex-col gap-5 sm:flex-row">
          {(coach as any).profiles?.avatar_url || (coach as any).avatar_url ? <img src={(coach as any).profiles?.avatar_url ?? (coach as any).avatar_url} alt="" className="h-24 w-24 rounded-3xl object-cover"/> : <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-emerald-500/10 text-3xl font-extrabold text-emerald-300">{displayName.slice(0,1)}</div>}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">{isDemo ? "بيانات عرض تجريبي" : "مدرب موثّق"}</span><span className="rounded-full bg-neutral-800 px-2.5 py-1 text-[10px] text-neutral-400">{((coach as any).sports ?? []).join(" · ")}</span></div>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold">{displayName}<BadgeCheck className="text-emerald-400" size={20}/></h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-400">{(coach as any).headline ?? (coach as any).specialization}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-400"><span className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-3 py-1.5 text-amber-300"><Star size={13} fill="currentColor"/>{Number((coach as any).rating).toFixed(1)} · {Number((coach as any).total_reviews ?? 0)} تقييم</span><span className="rounded-full bg-neutral-950 px-3 py-1.5">{Number((coach as any).experience_years ?? 0)} سنين خبرة</span><span className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-3 py-1.5"><MapPin size={13}/>{locations[0] ?? "أونلاين"}</span></div>
          </div>
        </div>
        <p className="mt-5 rounded-2xl bg-neutral-950/80 p-4 text-sm leading-7 text-neutral-300">{(coach as any).bio}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-neutral-800 p-4"><p className="text-[11px] text-neutral-500">أماكن التدريب</p><p className="mt-2 text-sm font-semibold">{locations.length ? locations.join(" · ") : "أونلاين"}</p></div><div className="rounded-2xl border border-neutral-800 p-4"><p className="text-[11px] text-neutral-500">اللغات</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold"><Languages size={15} className="text-emerald-400"/>{languages.length ? languages.join(" · ") : "العربية"}</p></div></div>
      </section>

      <section className="space-y-3">
        <div><h2 className="text-xl font-extrabold">احجز جلستك</h2><p className="mt-1 text-xs text-neutral-500">اختاري موعدًا فعليًا من جدول المدرب. السعر واضح قبل التأكيد.</p></div>
        {isDemo ? <DemoBookingForm coachId={id} sessionRate={Number((coach as any).session_rate)} packageRate={Number((coach as any).package_8_rate)} locations={locations} availability={availability}/> : <BookingForm coachId={id} sessionRate={Number((coach as any).session_rate)} packageRate={Number((coach as any).package_8_rate)} locations={locations} availability={availability}/>} 
      </section>

      {isDemo && <section className="space-y-3"><div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-400"/><h2 className="text-xl font-extrabold">لماذا نثق في الملف ده؟</h2></div><div className="grid gap-3 sm:grid-cols-3"><Info icon={<Clock3 size={16}/>} title="مواعيد فعلية" text="المواعيد المعروضة خارجة من جدول توفر المدرب."/><Info icon={<BadgeCheck size={16}/>} title="هوية واضحة" text="الحالة التجريبية مميزة، ولا يتم خلطها مع حساب حقيقي."/><Info icon={<Star size={16}/>} title="تقييمات منفصلة" text="بيانات العرض لا تغير التقييمات الحقيقية للنظام."/></div></section>}

      {isDemo && <section className="space-y-2"><h2 className="text-xl font-extrabold">آخر التقييمات</h2>{reviews.length ? reviews.map((r:any)=><div key={r.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"><div className="flex items-center justify-between gap-3"><span className="font-bold">{r.athlete?.full_name ?? "متدرب"}</span><span className="text-amber-300">★ {r.rating}</span></div><p className="mt-2 text-sm leading-6 text-neutral-400">{r.comment}</p></div>) : <p className="rounded-2xl bg-neutral-900 p-5 text-sm text-neutral-500">لسه مفيش تقييمات معروضة للمدرب ده.</p>}</section>}
    </div>
  );
}
function Info({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"><div className="flex items-center gap-2 text-emerald-400">{icon}<span className="font-bold text-white">{title}</span></div><p className="mt-2 text-xs leading-5 text-neutral-500">{text}</p></div>}
