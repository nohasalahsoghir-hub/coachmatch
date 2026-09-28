"use client";
import { useState,useTransition } from "react";
import { CalendarCheck2 } from "lucide-react";
import { setCoachBookingAcceptance } from "@/lib/actions/coach";
export function AvailabilityToggle({initial}:{initial:boolean}){const[active,setActive]=useState(initial);const[busy,start]=useTransition();const toggle=()=>start(async()=>{try{setActive(await setCoachBookingAcceptance(!active))}catch{}});return <button type="button" disabled={busy} onClick={toggle} className={`inline-flex min-h-12 items-center gap-2 rounded-2xl px-4 text-xs font-black ${active?"bg-cobalt-500 text-white":"border border-white/10 bg-white/5 text-[#a9b9b2]"}`}><CalendarCheck2 size={16}/>{busy?"جاري التحديث...":active?"استقبال الحجوزات مفعّل":"استقبال الحجوزات متوقف"}</button>}
