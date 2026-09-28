"use client";

import { useState,useTransition } from "react";
import { Plus,Save,Trash2 } from "lucide-react";
import { saveCoachAvailability } from "@/lib/actions/coach";

type Block={day:number;start_time:string;end_time:string;is_active?:boolean};
const DAYS=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

export function AvailabilityEditor({initial}:{initial:Block[]}){
  const [blocks,setBlocks]=useState<Block[]>(initial);
  const [busy,start]=useTransition();
  const [error,setError]=useState("");
  const [ok,setOk]=useState(false);
  const add=(day:number)=>{setOk(false);if(blocks.filter(x=>x.day===day).length>=8)return;setBlocks(x=>[...x,{day,start_time:"09:00",end_time:"13:00",is_active:true}])};
  const update=(index:number,patch:Partial<Block>)=>{setOk(false);setBlocks(x=>x.map((b,i)=>i===index?{...b,...patch}:b))};
  const remove=(index:number)=>{setOk(false);setBlocks(x=>x.filter((_,i)=>i!==index))};
  const save=()=>start(async()=>{
    setError("");setOk(false);
    try{await saveCoachAvailability(blocks);setOk(true);}
    catch(e){setError(e instanceof Error?e.message:"تعذر حفظ الجدول");}
  });
  return <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-4">
    <div><p className="font-black">الجدول الأسبوعي</p><p className="mt-1 text-xs text-[var(--muted-2)]">أضيفي فترة أو أكثر لكل يوم. المواعيد العامة تُحسب تلقائيًا من هنا.</p></div>
    <div className="space-y-3">
      {DAYS.map((label,day)=>{
        const dayBlocks=blocks.map((b,i)=>({b,i})).filter(x=>x.b.day===day);
        return <section key={day} className="rounded-2xl bg-[var(--surface-2)] p-4">
          <div className="flex items-center justify-between"><h3 className="font-bold">{label}</h3><button type="button" disabled={busy||dayBlocks.length>=8} onClick={()=>add(day)} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-cobalt-500/20 px-3 text-xs font-black text-cobalt-300"><Plus size={14}/>إضافة فترة</button></div>
          {dayBlocks.length===0?<p className="mt-3 text-xs text-[var(--muted-2)]">لا توجد مواعيد.</p>:<div className="mt-3 space-y-2">{dayBlocks.map(({b,i})=><div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><label className="text-[10px] text-[var(--muted-2)]">من<input type="time" value={b.start_time.slice(0,5)} onChange={e=>update(i,{start_time:e.target.value})} className="field mt-1" /></label><label className="text-[10px] text-[var(--muted-2)]">إلى<input type="time" value={b.end_time.slice(0,5)} onChange={e=>update(i,{end_time:e.target.value})} className="field mt-1" /></label><button type="button" disabled={busy} onClick={()=>remove(i)} aria-label={`حذف فترة ${label}`} className="self-end inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-500/20 px-3 text-rose-200"><Trash2 size={15}/></button></div>)}</div>}
        </section>;
      })}
    </div>
    {error&&<p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
    {ok&&<p className="rounded-xl bg-emerald-500/10 p-3 text-xs font-bold text-emerald-200">تم حفظ الجدول وتحديث المواعيد العامة.</p>}
    <button type="button" disabled={busy} onClick={save} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cobalt-500 text-sm font-black text-white disabled:opacity-50"><Save size={16}/>{busy?"جاري حفظ الجدول...":"حفظ الجدول"}</button>
  </div>;
}
