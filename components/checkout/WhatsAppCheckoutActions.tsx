"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Copy, Check, Clock3, ShieldCheck, ArrowRight } from "lucide-react";
import { buildWhatsAppLink, type BookingWhatsAppDetails } from "@/lib/whatsapp";

interface Props {
  details: BookingWhatsAppDetails;
  holdExpiresAt?: string;
  instapayHandle?: string;
  vodafoneCashNumber?: string;
}

export function WhatsAppCheckoutActions({
  details,
  holdExpiresAt,
  instapayHandle = "coachmatch@instapay",
  vodafoneCashNumber = "01100229462",
}: Props) {
  const [copiedInsta, setCopiedInsta] = useState(false);
  const [copiedVoda, setCopiedVoda] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  // Live countdown timer for the hold expiration
  useEffect(() => {
    if (!holdExpiresAt) return;

    function updateTimer() {
      const diff = new Date(holdExpiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("انتهت المهلة");
        setIsExpired(true);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const copyToClipboard = (text: string, type: "insta" | "voda") => {
    navigator.clipboard.writeText(text);
    if (type === "insta") {
      setCopiedInsta(true);
      setTimeout(() => setCopiedInsta(false), 2000);
    } else {
      setCopiedVoda(true);
      setTimeout(() => setCopiedVoda(false), 2000);
    }
  };

  const whatsappUrl = buildWhatsAppLink(details);

  return (
    <div className="space-y-5">
      {/* Expiry Timer Banner */}
      {holdExpiresAt && (
        <div
          className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-bold ${
            isExpired
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-amber-400/30 bg-amber-400/10 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock3 size={16} />
            <span>{isExpired ? "انتهت مهلة التحويل" : "مهلة تحويل المبلغ وإرسال الإيصال:"}</span>
          </div>
          <div className="font-display text-sm tracking-wider tabular-nums">
            {isExpired ? "يرجى إنشاء حجز جديد" : timeLeft}
          </div>
        </div>
      )}

      {/* Payment Options (InstaPay & Vodafone Cash) */}
      <div className="rounded-3xl border border-white/10 bg-[var(--surface)] p-5">
        <h2 className="text-sm font-black text-white">طرق التحويل المتاحة</h2>
        <p className="mt-1 text-xs text-[#84988f]">
          حوّل المبلغ المطلوب ({Number(details.totalAmount).toLocaleString("ar-EG")} ج.م) باستخدام إحدى الوسائل التالية:
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* InstaPay */}
          <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-[#07110e] p-3.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">InstaPay (انستاباي)</span>
              <div className="mt-1 font-mono text-xs font-bold text-white">{instapayHandle}</div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(instapayHandle, "insta")}
              className="inline-flex h-8 items-center gap-1 rounded-xl bg-white/5 px-2.5 text-[11px] font-bold text-white transition hover:bg-white/10 active:scale-95"
            >
              {copiedInsta ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copiedInsta ? "تم النسخ" : "نسخ"}
            </button>
          </div>

          {/* Vodafone Cash */}
          <div className="flex items-center justify-between rounded-2xl border border-white/6 bg-[#07110e] p-3.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">فودافون كاش (Vodafone Cash)</span>
              <div className="mt-1 font-mono text-xs font-bold text-white">{vodafoneCashNumber}</div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(vodafoneCashNumber, "voda")}
              className="inline-flex h-8 items-center gap-1 rounded-xl bg-white/5 px-2.5 text-[11px] font-bold text-white transition hover:bg-white/10 active:scale-95"
            >
              {copiedVoda ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copiedVoda ? "تم النسخ" : "نسخ"}
            </button>
          </div>
        </div>
      </div>

      {/* Main WhatsApp CTA */}
      <div className="space-y-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-4 py-3 text-base font-black text-[#072412] shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.01] hover:bg-[#22bf5b] active:scale-100"
        >
          <MessageCircle size={22} className="fill-current" />
          <span>إرسال تفاصيل الحجز والإيصال عبر WhatsApp</span>
        </a>

        <div className="flex items-center justify-center gap-2 text-center text-[11px] text-[#71867c]">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>سيتم فتح محادثة مباشرة مع إدارة المنصة، مع كتابة رسالة الحجز تلقائياً.</span>
        </div>
      </div>

      {/* Secondary Action */}
      <div className="pt-2 text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#84988f] transition hover:text-white"
        >
          <span>متابعة حالة الحجز في لوحة حجوزاتي</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
