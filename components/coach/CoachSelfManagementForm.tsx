"use client";

import { useState,useTransition } from "react";
import { Save } from "lucide-react";
import { updateCoachProfile,uploadCoachAvatar } from "@/lib/actions/coach";

type Sport={slug:string;name_ar:string};
type Initial={headline:string;bio:string;session_rate:number;package_8_rate:number;sports:string[];training_locations:string[];languages:string[];avatar_url?:string|null};

export function CoachSelfManagementForm({initial,sports}:{initial:Initial;sports:Sport[]}){
  const [v,setV]=useState(initial);
  const [busy,start]=useTransition();
  const [ok,setOk]=useState(false);
  const [error,setError]=useState("");
  const update=(patch:Partial<Initial>)=>{setV(x=>({...x,...patch}));setOk(false);};
  const toggleSport=(name:string)=>update({sports:v.sports.includes(name)?v.sports.filter(x=>x!==name):[...v.sports,name]});
  const save=()=>start(async()=>{
    setError("");setOk(false);
    try{await updateCoachProfile({headline:v.headline,bio:v.bio,sessionRate:Number(v.session_rate),packageRate:Number(v.package_8_rate),sports:v.sports,locations:v.training_locations,languages:v.languages});setOk(true);}
    catch(e){setError(e instanceof Error?e.message:"تعذر حفظ البيانات");}
  });
  const upload=(file:File|null)=>{if(!file)return;const fd=new FormData();fd.set("file",file);start(async()=>{
    setError("");setOk(false);
    try{const url=await uploadCoachAvatar(fd);update({avatar_url:url});setOk(true);}
    catch(e){setError(e instanceof Error?e.message:"تعذر رفع الصورة");}
  })};
  return <div className="space-y-5">
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {v.avatar_url?<img src={v.avatar_url} alt="" className="h-20 w-20 rounded-3xl object-cover"/>:<div className="grid h-20 w-20 place-items-center rounded-3xl bg-cobalt-500/10 text-2xl font-black text-cobalt-300">{v.headline.slice(0,1)||"م"}</div>}
          <div><p className="font-black">الصورة الشخصية</p><p className="mt-1 text-[11px] text-[var(--muted-2)]">JPG أو PNG أو WebP حتى 5MB.</p></div>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-cobalt-500/20 px-4 text-xs font-black text-cobalt-300">اختيار صورة<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={busy} onChange={e=>upload(e.target.files?.[0]??null)}/></label>
      </div>
    </div>
    <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-[var(--muted)]">عنوانك<input value={v.headline} maxLength={120} onChange={e=>update({headline:e.target.value})} className="field mt-2" /></label>
        <label className="block text-xs text-[var(--muted)]">سعر الجلسة (ج.م)<input type="number" min={50} max={5000} value={v.session_rate} onChange={e=>update({session_rate:Number(e.target.value)})} className="field mt-2" /></label>
      </div>
      <label className="block text-xs text-[var(--muted)]">سعر باقة 8 حصص (ج.م)<input type="number" min={50} max={5000} value={v.package_8_rate} onChange={e=>update({package_8_rate:Number(e.target.value)})} className="field mt-2" /></label>
      <label className="block text-xs text-[var(--muted)]">نبذة عنك<textarea value={v.bio} maxLength={2500} onChange={e=>update({bio:e.target.value})} className="field mt-2 min-h-36 py-3" /></label>
      <div><p className="text-xs text-[var(--muted)]">الرياضات والتخصصات</p><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{sports.map(s=><button type="button" key={s.slug} disabled={busy} onClick={()=>toggleSport(s.name_ar)} className={`min-h-11 rounded-xl border px-3 text-right text-xs font-bold ${v.sports.includes(s.name_ar)?"border-cobalt-500 bg-cobalt-500/10 text-cobalt-300":"border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)]"}`}>{s.name_ar}</button>)}</div><p className="mt-2 text-[11px] text-[var(--muted-2)]">مختار: {v.sports.length}</p></div>
      <label className="block text-xs text-[var(--muted)]">أماكن التدريب<select className="field mt-2" multiple value={v.training_locations} onChange={e=>update({training_locations:Array.from(e.target.selectedOptions).map(x=>x.value)})}><option value="القاهرة">القاهرة</option><option value="الجيزة">الجيزة</option><option value="الإسكندرية">الإسكندرية</option><option value="المنصورة">المنصورة</option><option value="أسيوط">أسيوط</option><option value="سوهاج">سوهاج</option><option value="قنا">قنا</option><option value="الأقصر">الأقصر</option><option value="أسوان">أسوان</option><option value="أونلاين">أونلاين</option></select><span className="mt-2 block text-[10px] text-[var(--muted-2)]">استخدمي Ctrl/Cmd لاختيار أكثر من مكان.</span></label>
      <label className="block text-xs text-[var(--muted)]">اللغات<input value={v.languages.join("، ")} onChange={e=>update({languages:e.target.value.split("،").map(x=>x.trim()).filter(Boolean)})} className="field mt-2" /></label>
      {error&&<p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
      {ok&&<p className="rounded-xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-200">تم الحفظ وتحديث الملف العام.</p>}
      <button type="button" disabled={busy} onClick={save} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cobalt-500 text-sm font-black text-white disabled:opacity-50"><Save size={16}/>{busy?"جاري الحفظ...":"حفظ البيانات"}</button>
    </div>
  </div>;
}
