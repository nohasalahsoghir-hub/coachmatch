import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight,BadgeCheck,CalendarRange,ShieldAlert,SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityToggle } from "@/components/coach/AvailabilityToggle";
import { AvailabilityEditor } from "@/components/coach/AvailabilityEditor";
import { CoachSelfManagementForm } from "@/components/coach/CoachSelfManagementForm";

export default async function CoachProfilePage(){
  const s=await createClient();
  const {data:{user}}=await s.auth.getUser();
  if(!user)redirect("/auth/login");
  const [{data:profile},{data:coach},{data:sports},{data:availability}]=await Promise.all([
    s.from("profiles").select("full_name,role,avatar_url").eq("id",user.id).maybeSingle(),
    s.from("coaches").select("headline,bio,session_rate,package_8_rate,sports,training_locations,languages,is_verified,accepting_bookings").eq("id",user.id).maybeSingle(),
    s.from("sports").select("slug,name_ar").eq("is_active",true).order("sort_order"),
    s.from("coach_availability").select("day_of_week,start_time,end_time,is_active").eq("coach_id",user.id).order("day_of_week").order("start_time")
  ]);
  if(profile?.role!=="coach"||!coach)redirect("/dashboard");
  return <div className="mx-auto max-w-4xl space-y-6">
    <Link href="/coach/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--muted)]"><ArrowRight size={14}/>العودة للوحة المدرب</Link>
    <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold text-cobalt-300">إدارة ملفك</p><h1 className="mt-2 text-3xl font-black">كل إعداداتك في مكان واحد</h1><p className="mt-2 text-sm leading-7 text-[var(--muted)]">الأسعار، الرياضات، الأماكن، الصورة، جدول المواعيد واستقبال الحجوزات.</p></div>
        <AvailabilityToggle initial={Boolean(coach.accepting_bookings)}/>
      </div>
      {!coach.is_verified?<div className="mt-5 flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4"><ShieldAlert className="mt-0.5 shrink-0 text-amber-300" size={19}/><div><p className="text-sm font-black text-amber-100">حسابك قيد المراجعة</p><p className="mt-1 text-xs leading-6 text-amber-100/70">هيظهر ملفك للمتدربين بعد التوثيق. التوثيق يتم من خارج حساب المدرب.</p></div></div>:<div className="mt-5 flex items-center gap-2 rounded-2xl border border-cobalt-500/15 bg-cobalt-500/5 p-4 text-xs font-bold text-cobalt-200"><BadgeCheck size={17}/>حسابك موثّق وملفك مؤهل للظهور في البحث.</div>}
    </section>
    <section><div className="mb-3 flex items-center gap-2"><SlidersHorizontal size={18} className="text-cobalt-300"/><h2 className="text-xl font-black">البيانات والأسعار والرياضات</h2></div><CoachSelfManagementForm initial={{headline:coach.headline??"",bio:coach.bio??"",session_rate:Number(coach.session_rate),package_8_rate:Number(coach.package_8_rate),sports:coach.sports??[],training_locations:coach.training_locations??[],languages:coach.languages??["العربية"],avatar_url:profile?.avatar_url??null}} sports={sports??[]}/></section>
    <section><div className="mb-3 flex items-center gap-2"><CalendarRange size={18} className="text-cobalt-300"/><h2 className="text-xl font-black">المواعيد الأسبوعية</h2></div><AvailabilityEditor initial={(availability??[]).map((x:any)=>({day:Number(x.day_of_week),start_time:String(x.start_time).slice(0,5),end_time:String(x.end_time).slice(0,5),is_active:Boolean(x.is_active)}))}/></section>
  </div>;
}
