export default function PrivacyPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-4 py-10">
      <article className="space-y-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-8">
        <header>
          <p className="text-xs font-black text-cobalt-300">CoachMatch</p>
          <h1 className="mt-2 text-3xl font-black">سياسة الخصوصية</h1>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">آخر تحديث: 29 سبتمبر 2026</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-black">ما البيانات التي نجمعها؟</h2>
          <p className="leading-8 text-sm text-[var(--muted)]">نجمع البيانات اللازمة لتشغيل الحساب والمنصة، ومنها الاسم، البريد الإلكتروني، رقم الهاتف، صورة الملف الشخصي عند رفعها، بيانات الملف المهني للمدرب، أماكن التدريب، الرياضات، اللغات، مواعيد التوفر، وسجل الحجوزات والتقييمات المرتبطة بالحساب.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black">مشاركة رقم الهاتف والتواصل</h2>
          <p className="leading-8 text-sm text-[var(--muted)]">يظهر رقم هاتف المتدرب للمدرب داخل سجل الحجز الحالي، مع زر للتواصل عبر WhatsApp. لا يظهر رقم المدرب للمتدرب في الواجهة الحالية. يجب أن يكون استخدام بيانات التواصل مرتبطًا بالحجز والتنسيق حول الجلسة فقط.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black">كيف نستخدم البيانات؟</h2>
          <p className="leading-8 text-sm text-[var(--muted)]">نستخدم البيانات لتسجيل الدخول، تشغيل ملفات المدربين العامة، عرض المواعيد، إنشاء وإدارة الحجوزات، إرسال التنبيهات داخل المنصة، وإتاحة التقييم بعد اكتمال الجلسة. البيانات العامة للمدرب تُعرض فقط وفق حالة التوثيق وسياسات الظهور في المنصة.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black">مدة الاحتفاظ بالبيانات</h2>
          <p className="leading-8 text-sm text-[var(--muted)]">تُحتفظ ببيانات الحساب والحجوزات والتقييمات بالقدر اللازم لتشغيل الخدمة وسجلها التشغيلي، ما لم يتطلب حذفها قانون أو طلب مشروع من صاحب البيانات. قد تُحتفظ سجلات تشغيلية لازمة للأمان والنزاعات ومنع إساءة الاستخدام للفترة المطلوبة لذلك.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black">الدفع الإلكتروني</h2>
          <p className="leading-8 text-sm text-[var(--muted)]">لا توجد في النسخة الحالية بوابة دفع إلكترونية حقيقية. بعض حقول قواعد البيانات المتعلقة بالدفع والتسويات موجودة لأغراض بنيوية وتجريبية، ولا ينبغي اعتبارها دليلًا على تحصيل مالي فعلي داخل الخدمة الحالية.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black">طلبات الخصوصية والحذف</h2>
          <p className="leading-8 text-sm text-[var(--muted)]">لطلب الوصول إلى بياناتك أو تصحيحها أو حذفها، استخدمي وسيلة التواصل الرسمية المعتمدة من CoachMatch والمعلنة مع إطلاق الخدمة. لاستفسارات الخصوصية أو طلبات الوصول والتصحيح والحذف، استخدمي قناة التواصل الرسمية للمشروع عبر GitHub Issues: <a href="https://github.com/nohasalahsoghir-hub/coachmatch/issues" target="_blank" rel="noreferrer" className="font-bold text-cobalt-300 hover:underline">صفحة التواصل والشكاوى</a>. لا ترسلي بيانات حساسة أو كلمات مرور داخل البلاغ.</p>
        </section>
      </article>
    </main>
  );
}
