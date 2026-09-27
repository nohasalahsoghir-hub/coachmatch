"use client";
import { useState,useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { settlePayout } from "@/lib/actions/admin";
export function PayoutActions({payoutId}:{payoutId:string}){const[busy,start]=useTransition();const[error,setError]=useState("");return <div className="flex flex-wrap gap-2">{error&&<span className="text-[11px] text-rose-300">{error}</span>}<button type="button" disabled={busy} onClick={()=>{if(!window.confirm("تأكيد تسجيل تحويل المستحقات في بيئة الاختبار؟"))return;setError("");start(async()=>{try{await settlePayout(payoutId)}catch(e){setError(e instanceof Error?e.message:"تعذر تنفيذ التسوية")}})}} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-emerald-400 px-3 text-xs font-black text-[#052117] disabled:opacity-50"><CheckCircle2 size={13}/>{busy?"جاري التحويل...":"تسجيل التحويل"}</button></div>}
