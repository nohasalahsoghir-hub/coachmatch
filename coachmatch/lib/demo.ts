import { createClient } from "@/lib/supabase/server";

export async function getDemoSports() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sports").select("id, slug, name_ar, name_en, category, icon").eq("is_demo", true).eq("is_active", true).order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getVerifiedCoaches(filters: { sport?: string; location?: string; maxRate?: number } = {}) {
  const supabase = await createClient();
  const [{ data: real, error: realError }, { data: demo, error: demoError }, { data: sports }] = await Promise.all([
    supabase.from("coaches").select("id, bio, sports, session_rate, package_8_rate, training_locations, is_available_today, is_verified, rating, total_reviews, experience_years, headline, languages, profiles:profiles!coaches_id_fkey(full_name, avatar_url)").eq("is_verified", true),
    supabase.from("demo_coaches").select("id, sport_id, full_name, avatar_url, headline, bio, experience_years, session_rate, package_8_rate, rating, total_reviews, training_locations, languages, specialization, is_verified, is_available_today, is_demo").eq("is_demo", true),
    supabase.from("sports").select("id, slug, name_ar, name_en").eq("is_demo", true).eq("is_active", true),
  ]);
  if (realError) throw new Error(realError.message);
  if (demoError) throw new Error(demoError.message);
  const map = new Map((sports ?? []).map((s:any)=>[s.id,s]));
  const realRows = (real ?? []).filter((c:any)=>{
    if(filters.sport && !(c.sports ?? []).some((x:string)=>x.toLowerCase().includes(filters.sport!.toLowerCase()))) return false;
    if(filters.location && !(c.training_locations ?? []).includes(filters.location)) return false;
    if(filters.maxRate && Number(c.session_rate)>filters.maxRate) return false;
    return true;
  }).map((c:any)=>({...c,session_rate:Number(c.session_rate),package_8_rate:Number(c.package_8_rate),rating:Number(c.rating),is_demo:false}));
  const demoRows = (demo ?? []).map((c:any)=>{ const s=map.get(c.sport_id); return {...c,session_rate:Number(c.session_rate),package_8_rate:Number(c.package_8_rate),rating:Number(c.rating),sports:s?[s.name_ar]:["رياضة"],profiles:{full_name:c.full_name,avatar_url:c.avatar_url},sport_slug:s?.slug ?? "",is_demo:true}; }).filter((c:any)=>{
    const s=map.get(c.sport_id); const q=filters.sport?.toLowerCase();
    if(q && q!==s?.slug?.toLowerCase() && q!==s?.name_ar?.toLowerCase() && q!==s?.name_en?.toLowerCase()) return false;
    if(filters.location && !(c.training_locations ?? []).includes(filters.location)) return false;
    if(filters.maxRate && c.session_rate>filters.maxRate) return false;
    return true;
  });
  return [...realRows,...demoRows].sort((a:any,b:any)=>Number(b.rating)-Number(a.rating));
}

export async function getCoachById(id:string) {
  const supabase=await createClient();
  const {data:real,error:re}=await supabase.from("coaches").select("id,bio,sports,session_rate,package_8_rate,training_locations,is_available_today,is_verified,rating,total_reviews,instapay_address,experience_years,headline,languages,profiles:profiles!coaches_id_fkey(full_name,avatar_url,phone)").eq("id",id).maybeSingle();
  if(re) throw new Error(re.message);
  if(real) return {...real,session_rate:Number(real.session_rate),package_8_rate:Number(real.package_8_rate),rating:Number(real.rating),is_demo:false};
  const {data:demo,error:de}=await supabase.from("demo_coaches").select("id,sport_id,full_name,avatar_url,headline,bio,experience_years,session_rate,package_8_rate,rating,total_reviews,training_locations,languages,specialization,is_verified,is_available_today,is_demo").eq("id",id).eq("is_demo",true).maybeSingle();
  if(de) throw new Error(de.message); if(!demo) return null;
  const {data:sport}=await supabase.from("sports").select("id,slug,name_ar,name_en,category,icon").eq("id",demo.sport_id).maybeSingle();
  return {...demo,session_rate:Number(demo.session_rate),package_8_rate:Number(demo.package_8_rate),rating:Number(demo.rating),sports:sport?[sport.name_ar]:["رياضة"],profiles:{full_name:demo.full_name,avatar_url:demo.avatar_url,phone:null},is_demo:true,sport};
}

export async function getDemoCoachReviews(id:string) {
  const supabase=await createClient();
  const {data:reviews,error}=await supabase.from("demo_reviews").select("id,rating,comment,created_at,athlete_id").eq("coach_id",id).eq("is_demo",true).order("created_at",{ascending:false}).limit(8);
  if(error) throw new Error(error.message); if(!reviews?.length) return [];
  const ids=[...new Set(reviews.map((r:any)=>r.athlete_id))];
  const {data:athletes}=await supabase.from("demo_athletes").select("id,full_name,avatar_url").in("id",ids);
  const map=new Map((athletes??[]).map((a:any)=>[a.id,a]));
  return reviews.map((r:any)=>({...r,athlete:map.get(r.athlete_id)??null,rating:Number(r.rating)}));
}
