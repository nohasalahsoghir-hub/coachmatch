# CoachMatch V4 — التشغيل النهائي

هذه النسخة لا تبني منتج Demo منفصل. التطبيق نفسه هو المنتج، وبيانات الاختبار تُزرع داخل نفس جداول المنتج بعلامة داخلية فقط.

من جذر المستودع:

```powershell
powershell -ExecutionPolicy Bypass -File .\coachmatch_product_v3_update\apply_product_v4.ps1
```

السكريبت ينسخ المنتج الجديد، يحذف مسارات Demo القديمة من الواجهة، ينظف سجلات Demo القديمة، يزرع 120 مدربًا ومواعيد وعمليات اختبار في الجداول الحقيقية، يتحقق من سلامة الحالات والمال، ثم يعمل Build وGitHub وVercel.

الدفع في هذه النسخة Sandbox: رحلة الدفع تستخدم جداول وقواعد المنتج نفسها، لكن لا يتم خصم أموال حقيقية.

حسابات Seed التي ينشئها السكربت:
- athlete.seed@coachmatch.test
- coach.seed@coachmatch.test
- admin.seed@coachmatch.test

كلمة مرور الاختبار الموحدة: `CoachMatch2026!`
