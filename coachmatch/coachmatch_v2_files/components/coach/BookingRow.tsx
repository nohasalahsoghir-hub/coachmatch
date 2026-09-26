import { MessageCircle, MapPin, Clock } from "lucide-react";
import { ConfirmAttendanceButton } from "@/components/coach/ConfirmAttendanceButton";

type Props = { booking: { id:string; start_time:string; end_time:string; location:string; status:string; athleteName:string; athletePhone:string; } };
const labels: Record<string,string> = { pending:"في انتظار الدفع", confirmed:"مؤكد", completed:"مكتمل", cancelled:"ملغي" };
export function BookingRow({booking}:Props){
  const phone=(booking.athletePhone??"").replace(/\D/g,"").replace(/^0/,"");
  const waLink=phone?`https://wa.me/2${phone}`:"";
  return <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-extrabold">{booking.athleteName}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-neutral-500"><span className="inline-flex items-center gap-1"><Clock size={12}/>{booking.start_time.slice(0,5)}–{booking.end_time.slice(0,5)}</span><span className="inline-flex items-center gap-1"><MapPin size={12}/>{booking.location}</span></div></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${booking.status==='confirmed'?"bg-emerald-500/10 text-emerald-300":booking.status==='pending'?"bg-amber-500/10 text-amber-300":"bg-neutral-800 text-neutral-400"}`}>{labels[booking.status]??booking.status}</span></div><div className="mt-3 flex items-center justify-end gap-2">{waLink&&<a href={waLink} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-neutral-800 text-emerald-400" aria-label="التواصل عبر واتساب"><MessageCircle size={17}/></a>}{booking.status==='confirmed'&&<ConfirmAttendanceButton bookingId={booking.id}/>}</div></div>
}
