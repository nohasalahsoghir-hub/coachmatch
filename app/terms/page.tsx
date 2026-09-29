export default function TermsPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-4 py-10">
      <article className="space-y-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-8">
        <header><p className="text-xs font-black text-cobalt-300">CoachMatch</p><h1 className="mt-2 text-3xl font-black">شروط الاستخدام</h1><p className="mt-2 text-sm leading-7 text-[var(--muted)]">آخر تحديث: 29 سبتمبر 2026</p></header>
        <section className="space-y-3"><h2 className="text-lg font-black">الحساب والبيانات</h2><p className="leading-8 text-sm text-[var(--muted)]">يجب تقديم بيانات صحيحة والحفاظ على سرية بيانات تسجيل الدخول. استخدام حساب شخص آخر أو تقديم بيانات مضللة قد يؤدي إلى تقييد الحساب أو إيقافه وفقًا لظروف الحالة.</p></section>
        <section className="space-y-3"><h2 className="text-lg font-black">المدربون والحجوزات</h2><p className="leading-8 text-sm text-[var(--muted)]">يعرض CoachMatch ملفات مدربين ومواعيد متاحة للحجز. ظهور المدرب في الكتالوج مرتبط بحالة التوثيق. الحجز يتم من خلال المسار المتاح في المنصة، ويجب على الطرفين الالتزام بالموعد والمكان المحددين والتنسيق بشكل محترم.</p></section>
        <section className="space-y-3"><h2 className="text-lg font-black">التواصل</h2><p className="leading-8 text-sm text-[var(--muted)]">قد يظهر رقم هاتف المتدرب للمدرب داخل الحجز مع وسيلة تواصل عبر WhatsApp للتنسيق حول الجلسة. لا يجوز استخدام بيانات التواصل في التسويق المزعج أو أي غرض خارج التعامل المرتبط بالحجز.</p></section>
        <section className="space-y-3"><h2 className="text-lg font-black">الباقات والتجربة</h2><p className="leading-8 text-sm text-[var(--muted)]">الباقة التجريبية في النسخة الحالية مجانية وتجريبية، ومقيدة بقاعدة مرة واحدة لكل حساب. لا يوجد تحصيل إلكتروني حقيقي حاليًا.</p></section>
        <section className="space-y-3"><h2 className="text-lg font-black">الإلغاء والمسؤولية</h2><p className="leading-8 text-sm text-[var(--muted)]">قد تُطبق قواعد إلغاء وإرجاع الحصة كما تظهر في مسار الحجز. يظل كل طرف مسؤولًا عن دقة بياناته وتواصله وسلوكه أثناء الجلسة.</p></section>
        <section className="space-y-3"><h2 className="text-lg font-black">الخدمة الحالية</h2><p className="leading-8 text-sm text-[var(--muted)]">هذه النسخة قيد التطوير والتحسين. الميزات غير الموجودة في الواجهة لا يجب اعتبارها متاحة، وبالأخص معالجة المدفوعات الإلكترونية الفعلية.</p></section>
        <section className="space-y-3"><h2 className="text-lg font-black">التواصل بشأن الشروط</h2><p className="leading-8 text-sm text-[var(--muted)]">للاستفسارات المتعلقة بالشروط أو الحسابات أو الحجوزات، يمكن استخدام قناة التواصل الرسمية للمشروع عبر GitHub Issues: <a href="https://github.com/nohasalahsoghir-hub/coachmatch/issues" target="_blank" rel="noreferrer" className="font-bold text-cobalt-300 hover:underline">صفحة التواصل والشكاوى</a>. يُرجى عدم إرسال بيانات حساسة أو كلمات مرور داخل البلاغ.</p></section>
      </article>
    </main>
  );
}
