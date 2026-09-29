/**
 * WhatsApp message generation helper for CoachMatch manual payments.
 */

export const ADMIN_WHATSAPP_PHONE = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || "201100229462";

export interface BookingWhatsAppDetails {
  referenceCode: string;
  athleteName: string;
  athletePhone?: string;
  coachName: string;
  sports?: string[];
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  totalAmount: number;
}

export function buildBookingWhatsAppMessage(details: BookingWhatsAppDetails): string {
  const sportLabel = details.sports && details.sports.length > 0 ? ` (${details.sports.join(" · ")})` : "";
  const phoneText = details.athletePhone ? `\n📱 هاتف المتدرب: ${details.athletePhone}` : "";

  return (
`مرحباً CoachMatch 👋
أرغب في تأكيد حجز حصة تدريبية، وهذه تفاصيل الحجز:

📋 رقم الطلب: ${details.referenceCode}
👤 اسم المتدرب: ${details.athleteName}${phoneText}

🏋️‍♂️ الكابتن: ${details.coachName}${sportLabel}
📅 موعد الجلسة: ${details.sessionDate}
⏰ الوقت: ${details.startTime} – ${details.endTime}
📍 المكان: ${details.location}

💰 إجمالي المبلغ المطلوب: ${Number(details.totalAmount).toLocaleString("ar-EG")} ج.م

📎 مرفق صورة إيصال التحويل (انستاباي / فودافون كاش).
يرجى مراجعة التحويل وتأكيد الحجز على المنصة. شكراً لكم!`
  );
}

export function buildWhatsAppLink(details: BookingWhatsAppDetails, customPhone?: string): string {
  const phone = (customPhone || ADMIN_WHATSAPP_PHONE).replace(/\D/g, "");
  const message = buildBookingWhatsAppMessage(details);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
