"use client";
import { useRouter } from "next/navigation";
import { useState,useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { completeBooking } from "@/lib/actions/bookings";
export function ConfirmAttendanceButton({bookingId}:{bookingId:string}){const router=useRouter();const[pending,start]=useTransition();const[error,setError]=useState("");return <div className="flex flex-col items-end gap-1">{error&&<span role="alert" className="text-[11px] text-rose-300">{error}</span>}<button type="button" disabled={pending} onClick={()=>{if(!confirm("تأكدي أن الجلسة انتهت بالفعل قبل تسجيل اكتمالها."))return;setError("");start(async()=>{try{await completeBooking(bookingId);router.refresh()}catch(e){setError(e instanceof Error?e.message:"تعذر تسجيل اكتمال الجلسة")}})}} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cobalt-500 px-3 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 size={14}/>{pending?"جارٍ الحفظ...":"تسجيل اكتمال الجلسة"}</button></div>}
