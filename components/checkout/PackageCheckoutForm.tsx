"use client";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard,ShieldCheck } from "lucide-react";
import { purchasePackage } from "@/lib/actions/packages";
export function PackageCheckoutForm({coachId,total}:{coachId:string;total:number}){
  const router=useRouter(); const[busy,start]=useTransition(); const[error,setError]=useState(""); const[key]=useState(()=>`pkg-${crypto.randomUUID()}`);
  const submit=()=>{if(busy)return;const ok=window.confirm(`تأكيد شراء باقة 8 حصص مقابل ${total.toLocaleString("ar-EG")} ج.م؟`);if(!ok)return;setError("");start(async()=>{try{await purchasePackage(coachId,key);router.push("/dashboard?package=success")}catch(e){setError(e instanceof Error?e.message:"تعذر إتمام الشراء")}})};
  return <div><button type="button" disabled={busy} onClick={submit} className="inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 text-sm font-black text-[#052117] disabled:opacity-50"><CreditCard size={17}/>{busy?"جاري إتمام الشراء...":`تأكيد الدفع — ${total.toLocaleString("ar-EG")} ج.م`}</button><div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-[#70867c]"><ShieldCheck size={14} className="text-emerald-300"/> الدفع هنا في بيئة اختبارية ولا يتم خصم أموال حقيقية</div>{error&&<p role="alert" className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}</div>
}
