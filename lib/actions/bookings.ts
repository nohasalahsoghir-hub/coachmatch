"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createBooking(input: { coachId: string; sessionDate: string; startTime: string; endTime: string; location: string }) {
  const supabase = await createClient();
  const { data:{user} } = await supabase.auth.getUser();
  if (!user) throw new Error("لازم تسجل دخول أولًا");
  if (!input.coachId || !input.sessionDate || !input.startTime || !input.endTime || !input.location) throw new Error("بيانات الحجز ناقصة");
  if (input.startTime >= input.endTime) throw new Error("وقت البداية لازم يكون قبل النهاية");
  if (new Date(`${input.sessionDate}T${input.startTime}:00+03:00`) <= new Date()) throw new Error("اختاري موعدًا في المستقبل");

  const { data: coach, error: coachError } = await supabase.from("coaches").select("id,is_verified,training_locations").eq("id",input.coachId).eq("is_verified",true).single();
  if (coachError || !coach) throw new Error("المدرب غير موجود أو غير موثّق");
  if (coach.training_locations?.length && !coach.training_locations.includes(input.location)) throw new Error("المكان غير متاح عند هذا المدرب");

  const [y,m,d] = input.sessionDate.split("-").map(Number);
  const dow = new Date(Date.UTC(y,m-1,d)).getUTCDay();
  const { data: av } = await supabase.from("coach_availability").select("start_time,end_time").eq("coach_id",input.coachId).eq("is_active",true).eq("day_of_week",dow);
  const fits = (av ?? []).some((x:any)=>input.startTime >= String(x.start_time).slice(0,5) && input.endTime <= String(x.end_time).slice(0,5));
  if (!fits) throw new Error("الموعد خارج جدول توفر المدرب");

  const { data: blocked } = await supabase.from("coach_blocked_slots").select("starts_at,ends_at").eq("coach_id",input.coachId);
  const requestedStart = new Date(`${input.sessionDate}T${input.startTime}:00+03:00`).getTime();
  const requestedEnd = new Date(`${input.sessionDate}T${input.endTime}:00+03:00`).getTime();
  const blockedClash = (blocked ?? []).some((x:any)=>requestedStart < new Date(x.ends_at).getTime() && requestedEnd > new Date(x.starts_at).getTime());
  if (blockedClash) throw new Error("الموعد محجوز أو مقفول من المدرب");

  const { data: existing } = await supabase.from("bookings").select("id").eq("coach_id",input.coachId).eq("session_date",input.sessionDate).in("status",["pending","confirmed"]).lt("start_time",input.endTime).gt("end_time",input.startTime).limit(1);
  if (existing?.length) throw new Error("الموعد اتاخد قبل كده. اختاري موعدًا آخر");

  const { data: booking,error } = await supabase.from("bookings").insert({
    athlete_id:user.id, coach_id:input.coachId, session_date:input.sessionDate, start_time:input.startTime, end_time:input.endTime, location:input.location,
    status:"pending", payment_status:"pending", total_price:0, platform_fee:0, coach_net:0, subtotal:0, checkout_fee:0, platform_commission:0, total_amount:0, timezone:"Africa/Cairo", is_demo:false,
  }).select("id,status,payment_status,session_date,start_time,end_time,location").single();
  if(error || !booking) throw new Error(error?.message ?? "تعذر إرسال طلب الحجز");
  revalidatePath("/dashboard"); revalidatePath("/coach/dashboard");
  return booking;
}

export async function confirmAttendance(bookingId:string){
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)throw new Error("لازم تسجل دخول أولًا");
  const {data:b,error:e}=await supabase.from("bookings").select("coach_id,status,session_date,end_time,timezone").eq("id",bookingId).single(); if(e||!b)throw new Error("الحجز غير موجود"); if(b.coach_id!==user.id)throw new Error("مش مسموح لك تأكيد الحضور ده"); if(b.status!=="confirmed")throw new Error("الحجز مش مؤهل للإكمال");
  const sessionEnd=new Date(`${b.session_date}T${String(b.end_time).slice(0,8)}+03:00`); if(new Date()<sessionEnd)throw new Error("لسه ميعاد الحصة مخلصش");
  const {error}=await supabase.from("bookings").update({status:"completed",attendance_confirmed_at:new Date().toISOString()}).eq("id",bookingId).eq("coach_id",user.id).eq("status","confirmed"); if(error)throw new Error(error.message); revalidatePath("/dashboard");revalidatePath("/coach/dashboard");
}

export async function cancelBooking(bookingId:string, reason=""){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("لازم تسجل دخول أولًا");const {data:b,error:e}=await supabase.from("bookings").select("id,athlete_id,coach_id,status,session_date,start_time").eq("id",bookingId).single();if(e||!b)throw new Error("الحجز غير موجود");if(b.athlete_id!==user.id&&b.coach_id!==user.id)throw new Error("مش مسموح لك تلغي الحجز ده");if(!["pending","confirmed"].includes(b.status))throw new Error("الحجز ده لا يمكن إلغاؤه بالحالة الحالية");const {error}=await supabase.from("bookings").update({status:"cancelled",cancellation_reason:reason||null,cancelled_at:new Date().toISOString()}).eq("id",bookingId).in("status",["pending","confirmed"]);if(error)throw new Error(error.message);revalidatePath("/dashboard");revalidatePath("/coach/dashboard");}
