"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, Copy, Check, Clock3, ShieldCheck, ArrowLeft, CheckCircle2, HeartHandshake } from "lucide-react";
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
  const [copiedRef, setCopiedRef] = useState(false);
  const [hasNotifiedTransfer, setHasNotifiedTransfer] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  // Live countdown timer for the hold expiration
  useEffect(() => {
    if (!holdExpiresAt || hasNotifiedTransfer) return;

    function updateTimer() {
      const diff = new Date(holdExpiresAt!).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("انتهت مهلة الحجز المبدئي");
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
  }, [holdExpiresAt, hasNotifiedTransfer]);

  const copyToClipboard = (text: string, type: "insta" | "voda" | "ref") => {
    navigator.clipboard.writeText(text);
    if (type === "insta") {
      setCopiedInsta(true);
      setTimeout(() => setCopiedInsta(false), 2000);
    } else if (type === "voda") {
      setCopiedVoda(true);
      setTimeout(() => setCopiedVoda(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const whatsappUrl = buildWhatsAppLink(details);

  return (
    <div className="space-y-5">
      {/* Reassuring Hold Status Banner */}
      {hasNotifiedTransfer ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
          <div>
            <div className="text-sm font-black">تم تسجيل إشعارك بالتحويل! موعدك محمي بنجاح ✓</div>
            <div className="mt-0.5 text-[11px] opacity-90">
              يرجى إرسال صورة الإيصال عبر الواتساب أدناه ليتم تثبيت الحجز في جدول الكابتن فوراً.
            </div>
          </div>
        </div>
      ) : holdExpiresAt ? (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-4 text-xs font-bold ${
            isExpired
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-amber-400/30 bg-amber-400/10 text-amber-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock3 size={16} />
            <span>{isExpired ? "انتهت مهلة الحجز المبدئي:" : "الموعد محجوز باسمك مؤقتاً لمدة:"}</span>
          </div>
          <div className="font-display text-sm tracking-wider tabular font-black">
            {isExpired ? "يمكنك تجديد الموعد في أي وقت" : timeLeft}
          </div>
        </div>
      ) : null}

      {/* Payment Options (InstaPay & Vodafone Cash) */}
      <div className="surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[var(--text)]">وسائل التحويل المباشرة</h2>
          <span className="text-xs font-bold text-[var(--cobalt)]">بدون أي عمولات تحويل</span>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          حوّل المبلغ المطلوب ({Number(details.totalAmount).toLocaleString("ar-EG")} ج.م) باستخدام إحدى الوسائل التالية:
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* InstaPay */}
          <div className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">InstaPay (انستاباي)</span>
              <div className="mt-1 font-mono text-xs font-bold text-[var(--text)]">{instapayHandle}</div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(instapayHandle, "insta")}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-3)] px-3 text-xs font-bold text-[var(--text)] transition hover:border-[var(--cobalt)] active:scale-95"
            >
              {copiedInsta ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedInsta ? "تم النسخ" : "نسخ المعرّف"}</span>
            </button>
          </div>

          {/* Vodafone Cash */}
          <div className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">فودافون كاش (Vodafone Cash)</span>
              <div className="mt-1 font-mono text-xs font-bold text-[var(--text)]">{vodafoneCashNumber}</div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(vodafoneCashNumber, "voda")}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-3)] px-3 text-xs font-bold text-[var(--text)] transition hover:border-[var(--cobalt)] active:scale-95"
            >
              {copiedVoda ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedVoda ? "تم النسخ" : "نسخ الرقم"}</span>
            </button>
          </div>
        </div>

        {/* Customer-Friendly Hint: Reference Code */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <span>💡 اكتب كود الطلب في ملاحظات التحويل:</span>
            <strong className="font-mono text-[var(--text)] text-sm">{details.referenceCode}</strong>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(details.referenceCode, "ref")}
            className="text-[11px] font-bold text-[var(--cobalt)] hover:underline"
          >
            {copiedRef ? "تم نسخ الكود ✓" : "نسخ الكود"}
          </button>
        </div>
      </div>

      {/* Customer Action: "I have already transferred" */}
      {!hasNotifiedTransfer && (
        <button
          type="button"
          onClick={() => setHasNotifiedTransfer(true)}
          className="w-full rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-3.5 text-center text-xs font-bold text-[var(--muted)] transition hover:border-[var(--cobalt)] hover:text-white"
        >
          <span>هل أتممت التحويل البنكي بالفعل؟ اضغط هنا لتأكيد إرسالك وحماية موعدك</span>
        </button>
      )}

      {/* Main WhatsApp CTA */}
      <div className="space-y-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-4 py-3.5 text-base font-black text-[#072412] shadow-lg shadow-[#25D366]/20 transition-all hover:scale-[1.01] hover:bg-[#22bf5b] active:scale-100"
        >
          <MessageCircle size={22} className="fill-current" />
          <span>إرسال تفاصيل الحجز والإيصال عبر WhatsApp</span>
        </a>

        <div className="flex items-center justify-center gap-2 text-center text-xs text-[var(--muted-2)]">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>ستفتح محادثة مباشرة مع إدارة المنصة، مع كتابة رسالة الحجز تلقائياً دون أي مجهود منك.</span>
        </div>
      </div>

      {/* Peace of Mind Guarantee Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-[var(--muted)] space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <HeartHandshake size={16} />
          <span>ضمان CoachMatch لراحة بالك وحماية مدفوعاتك</span>
        </div>
        <p className="text-[11px] leading-5">
          • <strong>استرداد نقدي فوري 100%</strong> في حال تعذر حضور المدرب أو رغبتك في الإلغاء قبل موعد الحصة بـ 6 ساعات.<br />
          • المدرب لا يستلم مستحقاته إلا بعد حضورك ورضاك التام عن الحصة التدريبية.
        </p>
      </div>

      {/* Secondary Action */}
      <div className="pt-2 text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] transition hover:text-white"
        >
          <span>متابعة حالة الحجز في لوحة حجوزاتي</span>
          <ArrowLeft size={14} />
        </Link>
      </div>
    </div>
  );
}
