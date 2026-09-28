import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote,CalendarDays,Users,Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BookingRow } from "@/components/coach/BookingRow";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function CoachDashboard(){
  const s=await createClient();
  const {data:{user}}=await s.auth.getUser();
  if(!user)redirect("/auth/login");
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo"}).format(new Date());
  const [{data:profile},{data:coach},{data:upcoming},{data:completed}]=await Promise.all([
    s.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle(),
    s.from("coaches").select("accepting_bookings,rating,total_reviews,session_rate").eq("id",user.id).maybeSingle(),
    s.from("bookings").select("id,session_date,start_time,end_time,location,status,athlete:profiles!bookings_athlete_id_fkey(full_name,phone),athlete_id").eq("coach_id",user.id).in("status",["pending","confirmed"]).gte("session_date",today).order("session_date").order("start_time").limit(12),
    s.from("bookings").select("athlete_id,coach_net").eq("coach_id",user.id).eq("status","completed").gte("session_date",today)
  ]);
  if(!coach||profile?.role!=="coach")redirect("/dashboard");
  const earnings=(completed??[]).reduce((sum:number,b:any)=>sum+Number(b.coach_net??0),0);
  const trainees=new Set((completed??[]).map((b:any)=>b.athlete_id).filter(Boolean)).size;
  return <div className="space-y-7">
    <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-7"><div><p className="text-xs font-bold text-cobalt-300">مساحة المدرب</p><h1 className="mt-2 text-3xl font-black">أهلًا {profile?.full_name??"مدربنا"} 👋</h1><p className="mt-2 text-sm text-[var(--muted)]">تابع مواعيدك وجلساتك، وعدّل ملفك من صفحة الإدارة الشخصية.</p></div><Link href="/coach/profile" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-cobalt-500/20 px-4 text-xs font-black text-cobalt-300">إدارة الملف والمواعيد</Link></section>
    <div className="grid gap-3 sm:grid-cols-3"><Stat i={Banknote} v={`${earnings.toLocaleString("ar-EG")} ج.م`} l="قيمة الجلسات المكتملة"/><Stat i={Users} v={trainees} l="متدربين بجلسات مكتملة"/><Stat i={Star} v={Number(coach.rating??0).toFixed(1)} l={`${coach.total_reviews??0} تقييم`}/></div>
    <section><div className="mb-3 flex items-center gap-2"><CalendarDays size={18} className="text-cobalt-300"/><h2 className="text-xl font-black">الحجوزات القادمة</h2></div>{upcoming?.length?<div className="grid gap-3">{upcoming.map((b:any)=>{const a=Array.isArray(b.athlete)?b.athlete[0]:b.athlete;return <BookingRow key={b.id} booking={{id:b.id,start_time:String(b.start_time),end_time:String(b.end_time),location:b.location,status:b.status,athleteName:a?.full_name??"متدرب",athletePhone:a?.phone??""}}/>})}</div>:<EmptyState title="مفيش حجوزات قادمة" text="فعّل استقبال الحجوزات واضبط جدولك من إدارة الملف." href="/coach/profile" label="إدارة الملف"/></section>
  </div>;
}
function Stat({i:Icon,v,l}:{i:any;v:string|number;l:string}){return <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"><Icon size={17} className="text-cobalt-300"/><div className="mt-2 text-xl font-black">{v}</div><div className="mt-1 text-[11px] text-[var(--muted-2)]">{l}</div></div>}
