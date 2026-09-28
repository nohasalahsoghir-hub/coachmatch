"use client";
import { useRouter } from "next/navigation";
import { useState,useTransition } from "react";
import { XCircle } from "lucide-react";
import { cancelBooking } from "@/lib/actions/bookings";
export function BookingActions({bookingId,status}:{bookingId:string;status:string}){const router=useRouter();const[pending,start]=useTransition();const[error,setError]=useState("");if(!["pending","confirmed"].includes(status))return null;const cancel=()=>{if(!confirm(status==="pending"?"إلغاء طلب الحجز؟":"إلغاء الحجز؟ سيتم تطبيق سياسة الإلغاء."))return;setError("");start(async()=>{try{await cancelBooking(bookingId,"إلغاء من حساب المتدرب");router.refresh()}catch(e){setError(e instanceof Error?e.message:"تعذر الإلغاء")}})};return <div className="mt-3 flex items-center justify-end gap-2">{error&&<span className="text-[11px] text-rose-300">{error}</span>}<button type="button" disabled={pending} onClick={cancel} className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-rose-500/20 px-4 text-xs font-bold text-rose-200 disabled:opacity-50"><XCircle size={14}/>{pending?"جاري الإلغاء...":"إلغاء الحجز"}</button></div>}
