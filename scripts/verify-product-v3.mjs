import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root=process.cwd();
const envPath=path.join(root,".env.local");
const env=fs.existsSync(envPath)?fs.readFileSync(envPath,"utf8"):"";
for(const line of env.split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m&&process.env[m[1]]===undefined)process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,"");}
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error("Supabase server credentials are missing in .env.local");
const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});

const count=async(table,filter={})=>{let q=db.from(table).select("*",{count:"exact",head:true});for(const[k,v]of Object.entries(filter))q=q.eq(k,v);const{count,error}=await q;if(error)throw error;return count||0;};

const coaches=await count("coaches",{is_demo:true,is_verified:true});
const availability=await count("coach_availability",{is_demo:true});
const coachSports=await count("coach_sports",{is_demo:true});
if(coaches!==20)throw new Error(`Expected 20 seeded demo coaches, found ${coaches}`);
if(availability<140)throw new Error(`Expected demo availability for 20 coaches, found ${availability}`);
if(coachSports<20)throw new Error(`Expected demo coach-sport rows for 20 coaches, found ${coachSports}`);

const publicCatalog=await count("coach_public_catalog");
const publicProfiles=await count("coach_public_profiles");
if(publicCatalog<coaches||publicProfiles<coaches)throw new Error(`Public coach projections are incomplete: catalog=${publicCatalog}, profiles=${publicProfiles}, coaches=${coaches}`);

const{data:catalog,error:catalogError}=await db.from("coach_public_catalog").select("id,full_name,avatar_url,sports,training_locations,accepting_bookings");
if(catalogError)throw catalogError;
if((catalog||[]).some(c=>Object.prototype.hasOwnProperty.call(c,"instapay_address")))throw new Error("Public coach catalog leaks internal payment fields");

const{data:impossible,error:impossibleError}=await db.from("bookings").select("id,status,package_id,total_amount").or("and(status.eq.confirmed,total_amount.lte.0,package_id.is.null),and(status.eq.completed,total_amount.lte.0,package_id.is.null)");
if(impossibleError)throw impossibleError;
if((impossible||[]).length)throw new Error(`Invalid direct booking values found: ${impossible.map(x=>x.id).join(",")}`);

const{data:packages,error:packageError}=await db.from("athlete_packages").select("id,total_sessions,remaining_sessions,session_unit_price");
if(packageError)throw packageError;
const invalidPackages=(packages||[]).filter(p=>Number(p.remaining_sessions)<0||Number(p.remaining_sessions)>Number(p.total_sessions));
if(invalidPackages.length)throw new Error(`Invalid package balances found: ${invalidPackages.length}`);

const{data:badReviews,error:badReviewError}=await db.from("reviews").select("id,booking_id,bookings!reviews_booking_id_fkey(status)");
if(badReviewError)throw badReviewError;
const invalidReviews=(badReviews||[]).filter(r=>{const b=Array.isArray(r.bookings)?r.bookings[0]:r.bookings;return b&&b.status!=="completed";});
if(invalidReviews.length)throw new Error(`Reviews without completed bookings found: ${invalidReviews.length}`);

const{data:futureCompleted,error:futureCompletedError}=await db.from("bookings").select("id,session_date,start_time,end_time,status,timezone").eq("status","completed");
if(futureCompletedError)throw futureCompletedError;
const futureNow=new Date();
const impossibleCompleted=(futureCompleted||[]).filter(b=>new Date(`${b.session_date}T${String(b.end_time).slice(0,8)}+03:00`)>futureNow);
if(impossibleCompleted.length)throw new Error(`Completed bookings still in the future: ${impossibleCompleted.map(x=>x.id).join(",")}`);

for(const relative of["app","components","lib"]){
  const base=path.join(root,relative),banned=[];
  const walk=dir=>{if(!fs.existsSync(dir))return;for(const name of fs.readdirSync(dir)){const full=path.join(dir,name),stat=fs.statSync(full);if(stat.isDirectory())walk(full);else if(/\.(tsx?|jsx?)$/.test(name)){const text=fs.readFileSync(full,"utf8");if(/@\/lib\/demo|demo_coaches|demo_bookings|demo_payments|demo_packages|DemoBookingForm/.test(text))banned.push(path.relative(root,full));}}};
  walk(base);
  if(banned.length)throw new Error(`Legacy demo product references remain: ${banned.join(", ")}`);
}

console.log(JSON.stringify({ok:true,demoCoaches:coaches,demoAvailability:availability,demoCoachSports:coachSports,publicCatalog,publicProfiles}));
