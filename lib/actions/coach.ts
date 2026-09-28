"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type AvailabilityBlock={day:number;start_time:string;end_time:string;is_active?:boolean};

async function assertCoach(){
  const s=await createClient();
  const {data:{user}}=await s.auth.getUser();
  if(!user) throw new Error("لازم تسجل دخول");
  const {data:profile,error}=await s.from("profiles").select("role").eq("id",user.id).maybeSingle();
  if(error) throw new Error(error.message);
  if(profile?.role!=="coach") throw new Error("مش مسموح");
  return {s,user};
}

function cleanList(values:string[],max:number){
  return [...new Set(values.map(v=>v.trim()).filter(Boolean))].slice(0,max);
}

function validateTime(v:string){
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

export async function setCoachBookingAcceptance(next:boolean){
  const {s,user}=await assertCoach();
  const {error}=await s.from("coaches").update({accepting_bookings:Boolean(next)}).eq("id",user.id);
  if(error) throw new Error(error.message);
  revalidatePath("/coach/profile");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${user.id}`);
  return Boolean(next);
}

export async function updateCoachProfile(input:{
  headline:string;
  bio:string;
  sessionRate:number;
  packageRate:number;
  sports:string[];
  locations:string[];
  languages:string[];
}){
  const {s,user}=await assertCoach();
  const headline=input.headline.trim();
  const bio=input.bio.trim();
  if(!headline || headline.length>120) throw new Error("اكتبي عنوانًا بين حرف واحد و120 حرفًا");
  if(!bio || bio.length>2500) throw new Error("النبذة مطلوبة وبحد أقصى 2500 حرف");
  if(!Number.isFinite(input.sessionRate)||input.sessionRate<50||input.sessionRate>5000) throw new Error("سعر الجلسة يجب أن يكون بين 50 و5000 جنيه");
  if(!Number.isFinite(input.packageRate)||input.packageRate<50||input.packageRate>5000) throw new Error("سعر باقة 8 حصص يجب أن يكون بين 50 و5000 جنيه");

  const requestedSports=cleanList(input.sports,8);
  if(requestedSports.length===0) throw new Error("اختاري رياضة واحدة على الأقل");
  const {data:sportRows,error:sportError}=await s.from("sports").select("name_ar").eq("is_active",true);
  if(sportError) throw new Error(sportError.message);
  const allowed=new Set((sportRows??[]).map(x=>x.name_ar));
  if(requestedSports.some(x=>!allowed.has(x))) throw new Error("اختاري الرياضات من قائمة المنصة فقط");

  const locations=cleanList(input.locations,8);
  if(locations.length===0) throw new Error("أضيفي مكان تدريب واحد على الأقل");
  const languages=cleanList(input.languages.length?input.languages:["العربية"],6);

  const {error}=await s.from("coaches").update({
    headline,
    bio,
    session_rate:Math.round(input.sessionRate*100)/100,
    package_8_rate:Math.round(input.packageRate*100)/100,
    sports:requestedSports,
    training_locations:locations,
    languages
  }).eq("id",user.id);
  if(error) throw new Error(error.message);

  revalidatePath("/coach/profile");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${user.id}`);
  return {ok:true};
}

export async function saveCoachAvailability(schedule:AvailabilityBlock[]){
  const {s,user}=await assertCoach();
  if(!Array.isArray(schedule)||schedule.length>56) throw new Error("عدد المواعيد الأسبوعية غير صحيح");

  const rows=schedule.map((x)=>({
    day:x.day,start_time:x.start_time,end_time:x.end_time,is_active:x.is_active!==false
  }));
  for(const row of rows){
    if(!Number.isInteger(row.day)||row.day<0||row.day>6) throw new Error("اليوم غير صحيح");
    if(!validateTime(row.start_time)||!validateTime(row.end_time)||row.end_time<=row.start_time) throw new Error("وقت غير صحيح");
  }
  for(let i=0;i<rows.length;i++){
    for(let j=i+1;j<rows.length;j++){
      const a=rows[i],b=rows[j];
      if(a.day===b.day && a.is_active && b.is_active && a.start_time<b.end_time && b.start_time<a.end_time){
        throw new Error("يوجد مواعيد متداخلة في نفس اليوم");
      }
    }
  }

  const {error}=await s.rpc("replace_coach_weekly_availability",{
    p_schedule:rows.map(x=>({day:x.day,start_time:x.start_time,end_time:x.end_time,is_active:x.is_active}))
  });
  if(error) throw new Error(error.message);

  revalidatePath("/coach/profile");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${user.id}`);
  return {ok:true,count:rows.length};
}

export async function uploadCoachAvatar(formData:FormData){
  const {s,user}=await assertCoach();
  const file=formData.get("file");
  if(!(file instanceof File)) throw new Error("اختاري صورة");
  if(file.size>5*1024*1024) throw new Error("الصورة يجب ألا تتجاوز 5 ميجابايت");
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("الصورة يجب أن تكون JPG أو PNG أو WebP");

  const path=`${user.id}/avatar`;
  const {error:uploadError}=await s.storage.from("coach-avatars").upload(path,file,{
    upsert:true,
    contentType:file.type,
    cacheControl:"3600"
  });
  if(uploadError) throw new Error(uploadError.message);

  const {data}=s.storage.from("coach-avatars").getPublicUrl(path);
  const avatarUrl=data.publicUrl;
  const {error:profileError}=await s.from("profiles").update({avatar_url:avatarUrl}).eq("id",user.id);
  if(profileError) throw new Error(profileError.message);

  revalidatePath("/coach/profile");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${user.id}`);
  return avatarUrl;
}
