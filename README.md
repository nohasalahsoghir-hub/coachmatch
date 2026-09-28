# CoachMatch 🥊⚽🎾

منصة سوق حقيقية ثنائية الاتجاه تربط المدربين الرياضيين المعتمدين بالمتدربين في مصر (30 رياضة تشمل اللياقة، السباحة، الفنون القتالية، البادل، التنس، وغيرها).

---

## 🚀 المميزات الرئيسية (Core Features)

1. **دليل المدربين (Discovery & Filtering):**
   - استعراض المدربين عبر 30 رياضة مصنفة.
   - فلترة متقدمة حسب: الرياضة، المدينة / المنطقة، السعر الأقصى للجلسة، والتوفر اليومي.
   - كروت مدربين مصممة بنظام **Night Stadium** مع تصنيف لوني لكل عائلة رياضية.

2. **الحجز والتجارة المباشرة (Real Commerce):**
   - حجز الجلسات الفردية مع حجز المؤقت التلقائي لمنع التعارضات (`/checkout/[id]`).
   - شراء باقات 8 جلسات مع خصم تلقائي وإدارة رصيد الجلسات (`/checkout/package/[id]`).
   - سجل مالي موثوق ومحمي (`money_ledger`).

3. **البوابات المخصصة (Dedicated Portals):**
   - **لوحة المتدرب (`/dashboard`):** متابعة الحجوزات القادمة، إدارة الباقات، تقييم الجلسات المكتملة.
   - **لوحة المدرب (`/coach/dashboard`):** إدارة المواعيد، تأكيد حضور المتدربين، طلب التوثيق، وتعديل الملف الشخصي (`/coach/profile`).
   - **لوحة الإدارة (`/admin`):** متابعة النزاعات، صرف مستحقات المدربين (Payouts)، وإدارة توثيق المدربين.

---

## 🛠️ البنية التقنية (Tech Stack)

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS.
- **Design System:** Night Stadium Theme (Dark Navy, Orange Flare `#FF6A3D`, Cairo & Changa Fonts).
- **Backend & Database:** Supabase (PostgreSQL) مع تفعيل Row Level Security (RLS) بالكامل على كافة الجداول.
- **Type Safety:** TypeScript صارم مع فحوصات بنية وتوافق كاملة.

---

## 📦 التشغيل المحلي (Local Development)

```bash
# 1. تثبيت الحزم
npm install

# 2. إعداد المتغيرات البيئية
# تأكد من ملء .env.local بالقيم التالية:
# NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 3. تشغيل خادم التطوير
npm run dev
```

افتح المتصفح على [http://localhost:3000](http://localhost:3000).

---

## 🛡️ الأمان والتحقق (Security & Verification)

* **RLS مفعّل:** جميع الجداول في مخطط `public` خاضعة لـ `rowsecurity = true`.
* **عزل مفتاح السيرفر:** `SUPABASE_SERVICE_ROLE_KEY` مستخدم فقط في Server Actions وسكربتات الإدارة ولا يتم تسريبه أبداً لجانب العميل.
* **فحص سلامة النظام:**
  ```bash
  node scripts/verify-product-v3.mjs
  ```
