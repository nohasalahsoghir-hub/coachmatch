"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
const ATHLETE="Sarah Ahmed";
function endTime(t:string){const [h,m]=t.split(":").map(Number);const n=h*60+m+60;return `${String(Math.floor(n/60)%24).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;}
export async function createDemoBooking(input:{coachId:string;sessionDate:string;startTime:string;location:string}){
 const s=createAdminClient(); const [{data:c},{data:a}]=await Promise.all([s.from("demo_coaches").select("id,full_name,session_rate").eq("id",input.coachId).eq("is_demo",true).maybeSingle(),s.from("demo_athletes").select("id,full_name").eq("full_name",ATHLETE).eq("is_demo",true).maybeSingle()]);
 if(!c||!a) throw new Error("بيانات العرض التجريبي غير مكتملة");
 const {data:busy}=await s.from("demo_bookings").select("id").eq("coach_id",c.id).eq("session_date",input.sessionDate).eq("start_time",input.startTime).in("status",["pending","confirmed"]).maybeSingle();
 if(busy) throw new Error("الميعاد ده اتاخد في العرض التجريبي. اختاري ميعاد تاني.");
 const rate=Number(c.session_rate), fee=10, net=Math.round(rate*.85*100)/100;
 const {data:b,error}=await s.from("demo_bookings").insert({athlete_id:a.id,coach_id:c.id,session_date:input.sessionDate,start_time:input.startTime,end_time:endTime(input.startTime),location:input.location,status:"confirmed",total_price:rate,platform_fee:fee,coach_net:net,is_demo:true}).select("id").single();
 if(error||!b) throw new Error(error?.message??"تعذر الحجز التجريبي");
 const ref=`CM-DEMO-${b.id.replaceAll("-","").slice(0,10).toUpperCase()}`;
 await s.from("demo_payments").insert({booking_id:b.id,athlete_id:a.id,coach_id:c.id,amount:rate+fee,method:"demo_card",status:"paid",provider_reference:ref,is_demo:true});
 await s.from("demo_notifications").insert({athlete_id:a.id,coach_id:c.id,title:"تم تأكيد الحجز",body:`تم حجز حصة مع ${c.full_name} يوم ${input.sessionDate} الساعة ${input.startTime.slice(0,5)}`,type:"booking",is_demo:true});
 revalidatePath("/demo");revalidatePath("/demo/athlete");revalidatePath("/demo/coach"); return {bookingId:b.id,reference:ref,coachName:c.full_name};
}
export async function purchaseDemoPackage(coachId:string){
 const s=createAdminClient(); const [{data:c},{data:a}]=await Promise.all([s.from("demo_coaches").select("id,full_name,package_8_rate").eq("id",coachId).eq("is_demo",true).maybeSingle(),s.from("demo_athletes").select("id").eq("full_name",ATHLETE).eq("is_demo",true).maybeSingle()]);
 if(!c||!a) throw new Error("بيانات العرض التجريبي غير مكتملة");
 const total=Number(c.package_8_rate)+10; const d=new Date();d.setDate(d.getDate()+90);
 const {data:p,error}=await s.from("demo_packages").insert({athlete_id:a.id,coach_id:c.id,total_sessions:8,remaining_sessions:8,price_paid:total,status:"active",expires_at:d.toISOString(),is_demo:true}).select("id").single();
 if(error||!p) throw new Error(error?.message??"تعذر إنشاء الباقة"); const ref=`CM-PKG-${p.id.replaceAll("-","").slice(0,10).toUpperCase()}`;
 await s.from("demo_payments").insert({athlete_id:a.id,coach_id:c.id,amount:total,method:"demo_card",status:"paid",provider_reference:ref,is_demo:true});
 await s.from("demo_notifications").insert({athlete_id:a.id,coach_id:c.id,title:"الباقة جاهزة",body:`تم تفعيل باقة 8 حصص مع ${c.full_name}`,type:"package",is_demo:true});
 revalidatePath("/demo");revalidatePath("/demo/athlete"); return {reference:ref,coachName:c.full_name};
}
