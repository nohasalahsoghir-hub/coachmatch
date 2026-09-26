# CoachMatch

منصة سوق ثنائية الاتجاه بتربط المدربين الرياضيين بالمتدربين — Fitness، سباحة، فنون قتالية.

## قاعدة البيانات
مشروع Supabase شغّال فعليًا: `osrearjvwjbenopyzseo` (eu-west-1). السكيمة والـ RLS اتعملوا بالفعل عليه.

## التشغيل محليًا
```bash
npm install
cp .env.example .env.local   # القيم الحقيقية موجودة بالفعل جوه .env.example
npm run dev
```

افتح `http://localhost:3000`.

## عشان تحوّل أول مدرب لموثّق (verified)
دلوقتي أي حساب "مدرب" جديد بيتسجل بـ `is_verified = false` تلقائيًا (مش بيظهر في صفحة الاكتشاف).
فعّل التوثيق يدويًا من Supabase SQL Editor:
```sql
update coaches set is_verified = true where id = '<coach-user-id>';
```

## البنية
- `lib/supabase/` — عملاء Supabase (browser / server / middleware)
- `lib/actions/` — Server Actions: `coaches.ts`, `bookings.ts`, `packages.ts`
- `lib/pricing.ts` — منطق العمولة (15%) والرسم الثابت (10 ج.م)
- `app/auth/` — تسجيل الدخول / إنشاء الحساب
- `app/dashboard/` — لوحة المتدرب
- `app/coach/dashboard/` — لوحة المدرب
- `app/coaches/` — استكشاف وفلترة المدربين + صفحة تفاصيل وحجز

## المتبقي لسه (اختياري لمرحلة تالية)
- بوابة دفع حقيقية (InstaPay/بطاقات) بدل تسجيل الشراء المباشر
- صفحة تقييمات بعد إتمام الجلسة
- إشعارات (WhatsApp/SMS) عند تأكيد الحجز
- توثيق المدربين (رفع مستندات) بدل التفعيل اليدوي
