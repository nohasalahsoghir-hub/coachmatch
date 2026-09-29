import Link from "next/link";
import { ArrowLeft, CalendarCheck2, ShieldCheck, Trophy, Users } from "lucide-react";

export default function HomePage() {
  return (
    <main className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-7 sm:p-10">
        <div className="max-w-3xl">
          <p className="text-xs font-bold text-cobalt-300">CoachMatch</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">
            اكتشف مدربك الرياضي واحجز الموعد المناسب.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-[var(--muted)]">
            مدربون موثّقون، مقارنة حسب الرياضة والمكان والسعر، مع مواعيد متاحة فعليًا قبل تأكيد الحجز.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/coaches" className="btn-cobalt min-h-12 px-5">
              استعراض المدربين <ArrowLeft size={15} />
            </Link>
            <Link
              href="/auth/sign-up?role=athlete"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--line)] px-5 text-sm font-bold text-[var(--muted)] hover:border-[var(--cobalt)] hover:text-white transition"
            >
              سجّل كمتدرب
            </Link>
            <Link
              href="/auth/sign-up?role=coach"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/[0.04] px-5 text-sm font-bold text-cobalt-300 hover:bg-white/10 transition"
            >
              <Trophy size={15} />
              انضم كمدرب
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Feature icon={Users} title="مدربون موثّقون" text="ملفات عامة واضحة ومعلومات تدريب أساسية وموثوقة." />
        <Feature icon={CalendarCheck2} title="مواعيد حقيقية" text="اختيار من جدول المدرب والمواعيد المتاحة فعليًا." />
        <Feature icon={ShieldCheck} title="حجز منظم وآمن" text="حماية من التعارض والضغط المكرر مع ضمان استرداد فوري." />
      </section>
    </main>
  );
}

function Feature({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <Icon size={18} className="text-cobalt-300" />
      <h2 className="mt-3 font-black">{title}</h2>
      <p className="mt-1 text-xs leading-6 text-[var(--muted-2)]">{text}</p>
    </div>
  );
}
