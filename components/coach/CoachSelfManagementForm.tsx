"use client";

import { useId, useState, useTransition } from "react";
import {
  Award,
  CheckCircle2,
  CreditCard,
  FileCheck,
  FileText,
  FileUp,
  MapPin,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";
import { SearchableCombobox } from "@/components/ui/SearchableCombobox";
import {
  deleteCoachCv,
  updateCoachProfile,
  uploadCoachAvatar,
  uploadCoachCv,
} from "@/lib/actions/coach";

type Sport = { slug: string; name_ar: string };

type Initial = {
  headline: string;
  bio: string;
  session_rate: number;
  package_8_rate: number;
  sports: string[];
  training_locations: string[];
  languages: string[];
  avatar_url?: string | null;
  cv_url?: string | null;
  instapay_address?: string | null;
};

const EGYPT_GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية (المنصورة)",
  "الشرقية (الزقازيق)",
  "الغربية (طنطا)",
  "المنوفية (شبين الكوم)",
  "القليوبية (بنها / شبرا)",
  "البحيرة (دمنهور)",
  "كفر الشيخ",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "البحر الأحمر (الغردقة)",
  "شمال سيناء",
  "جنوب سيناء (شرم الشيخ)",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "مطروح (الساحل الشمالي)",
  "الوادي الجديد",
  "أونلاين (عن بُعد)",
];

export function CoachSelfManagementForm({
  initial,
  sports,
}: {
  initial: Initial;
  sports: Sport[];
}) {
  const [v, setV] = useState(initial);
  const [busy, start] = useTransition();
  const [cvBusy, startCv] = useTransition();
  const [ok, setOk] = useState(false);
  const [cvOk, setCvOk] = useState(false);
  const [error, setError] = useState("");
  const [cvError, setCvError] = useState("");

  const avatarInputId = useId();
  const cvInputId = useId();

  const update = (patch: Partial<Initial>) => {
    setV((x) => ({ ...x, ...patch }));
    setOk(false);
  };

  const sportsMasterList = Array.from(
    new Set([...sports.map((s) => s.name_ar), ...v.sports])
  );

  // Live Math & Pricing Guardrails
  const sessionFee = Math.round((v.session_rate || 0) * 0.15);
  const sessionCoachNet = (v.session_rate || 0) - sessionFee;

  const singleTotal8 = (v.session_rate || 0) * 8;
  const minPackageRate = Math.round((v.session_rate || 0) * 4);
  const packageFee = Math.round((v.package_8_rate || 0) * 0.15);
  const packageCoachNet = (v.package_8_rate || 0) - packageFee;
  const packageUnitNet = Math.round(packageCoachNet / 8);

  const packageDiscountPct =
    singleTotal8 > 0 && v.package_8_rate < singleTotal8
      ? Math.round(((singleTotal8 - v.package_8_rate) / singleTotal8) * 100)
      : 0;

  let packageBoundError = "";
  if (v.session_rate > 0 && v.package_8_rate > 0) {
    if (v.package_8_rate >= singleTotal8) {
      packageBoundError = `سعر الباقة (${v.package_8_rate} ج.م) يجب أن يكون أقل من مجموع 8 جلسات فردية (${singleTotal8} ج.م) لمنح المتدربين خصماً تشجيعياً.`;
    } else if (v.package_8_rate < minPackageRate) {
      packageBoundError = `سعر الباقة لا يمكن أن يقل عن نصف قيمة الجلسات (${minPackageRate} ج.م) لحماية أرباحك.`;
    }
  }

  const save = () =>
    start(async () => {
      setError("");
      setOk(false);
      if (packageBoundError) {
        setError(packageBoundError);
        return;
      }
      try {
        await updateCoachProfile({
          headline: v.headline,
          bio: v.bio,
          sessionRate: Number(v.session_rate),
          packageRate: Number(v.package_8_rate),
          sports: v.sports,
          locations: v.training_locations,
          languages: v.languages,
          cvUrl: v.cv_url,
          instapayAddress: v.instapay_address,
        });
        setOk(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر حفظ البيانات");
      }
    });

  const uploadAvatar = (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      setError("");
      setOk(false);
      try {
        const url = await uploadCoachAvatar(fd);
        update({ avatar_url: url });
        setOk(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذر رفع الصورة");
      }
    });
  };

  const handleUploadCv = (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startCv(async () => {
      setCvError("");
      setCvOk(false);
      try {
        const res = await uploadCoachCv(fd);
        update({ cv_url: res.cv_url });
        setCvOk(true);
      } catch (e) {
        setCvError(e instanceof Error ? e.message : "تعذر رفع ملف السيرة الذاتية");
      }
    });
  };

  const handleDeleteCv = () => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف ملف السيرة الذاتية؟")) return;
    startCv(async () => {
      setCvError("");
      setCvOk(false);
      try {
        await deleteCoachCv();
        update({ cv_url: null });
        setCvOk(true);
      } catch (e) {
        setCvError(e instanceof Error ? e.message : "تعذر حذف الملف");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Avatar & Personal Brand */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {v.avatar_url ? (
              <img
                src={v.avatar_url}
                alt=""
                className="h-20 w-20 rounded-3xl object-cover border border-[var(--line)]"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-[rgba(62,111,242,0.1)] text-2xl font-black text-[var(--cobalt)]">
                {v.headline?.slice(0, 1) || "م"}
              </div>
            )}
            <div>
              <p className="text-base font-black text-[var(--text)]">الصورة الشخصية للمدرب</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                صورة واضحة ومهنية بالزي الرياضي تعزز ثقة المتدربين. (JPG, PNG, WebP حتى 5MB)
              </p>
            </div>
          </div>
          <label
            htmlFor={avatarInputId}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--cobalt)]/30 bg-[var(--cobalt)]/10 px-5 text-xs font-black text-[var(--cobalt)] transition hover:bg-[var(--cobalt)]/20"
          >
            <Upload size={14} />
            تغيير الصورة
            <input
              id={avatarInputId}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => uploadAvatar(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {/* 2. CV & Certifications Upload (Secured & Private) */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cobalt-300">
              <Award size={15} />
              <span>السيرة الذاتية والشهادات المعتمدة</span>
            </div>
            <h3 className="mt-1 text-base font-black text-[var(--text)]">
              توثيق المؤهلات وسنوات الخبرة
            </h3>
            <p className="mt-1 text-xs leading-6 text-[var(--muted)]">
              ارفع ملف الـ CV أو شهادات التدريب والاتحادات الرياضية لتسريع اعتماد حسابك وتفعيله لاستقبال الحجوزات.
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-[var(--muted-2)]">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>مستند محمي ومشفر، متاح فقط لك ولإدارة المنصة لغرض التوثيق والاعتماد.</span>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-5 text-center">
          {v.cv_url ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-right">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <FileCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text)]">تم رفع ملف السيرة الذاتية بنجاح ✓</p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-2)]">
                    الملف محفوظ بأمان ومتاح لفريق المراجعة لاعتماد وتوثيق الحساب.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={v.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] px-3 text-xs font-bold text-[var(--text)] transition hover:bg-white/5"
                >
                  <FileText size={14} />
                  معاينة الملف
                </a>
                <label
                  htmlFor={cvInputId}
                  className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[var(--cobalt)]/30 bg-[var(--cobalt)]/10 px-3 text-xs font-bold text-[var(--cobalt)] transition hover:bg-[var(--cobalt)]/20"
                >
                  <FileUp size={14} />
                  استبدال
                  <input
                    id={cvInputId}
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    className="sr-only"
                    disabled={cvBusy}
                    onChange={(e) => handleUploadCv(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  disabled={cvBusy}
                  onClick={handleDeleteCv}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-rose-500/30 text-rose-300 transition hover:bg-rose-500/10"
                  title="حذف الملف"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-3)] text-[var(--muted-2)]">
                <FileUp size={22} />
              </div>
              <p className="mt-3 text-xs font-bold text-[var(--text)]">
                لم يتم رفع سيرة ذاتية أو شهادات بعد
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted-2)]">
                يدعم ملفات PDF و Word والصور حتى 10 ميجابايت.
              </p>
              <label
                htmlFor={cvInputId}
                className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[var(--cobalt)] px-5 text-xs font-black text-white shadow-md shadow-[var(--cobalt)]/25 transition hover:scale-[1.02]"
              >
                <Upload size={14} />
                {cvBusy ? "جارٍ الرفع..." : "اختر ملف الـ CV أو الشهادة"}
                <input
                  id={cvInputId}
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="sr-only"
                  disabled={cvBusy}
                  onChange={(e) => handleUploadCv(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          )}

          {cvError && (
            <p role="alert" className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-200">
              {cvError}
            </p>
          )}
          {cvOk && (
            <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-300">
              تم تحديث ملف السيرة الذاتية بنجاح ✓
            </p>
          )}
        </div>
      </div>

      {/* 3. Core Profile & Pricing Details */}
      <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-6">
        <div>
          <h3 className="text-base font-black text-[var(--text)]">البيانات الأساسية والتسعير</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            حدد المسمى الظاهر للمتدربين، تسعير الجلسات والباقات، وبيانات استلام مستحقاتك يدويًا.
          </p>
        </div>

        {/* Headline */}
        <div>
          <label className="block text-xs font-bold text-[var(--muted)]">
            العنوان الظاهر في الملف والبطاقة
          </label>
          <input
            value={v.headline}
            maxLength={120}
            onChange={(e) => update({ headline: e.target.value })}
            placeholder="مثال: مدرب لياقة بدنية وبناء أجسام معتمد من IFBB"
            className="field mt-2 w-full text-xs"
          />
          <span className="mt-1 block text-[10px] text-[var(--muted-2)]">
            {v.headline.length} / 120 حرف
          </span>
        </div>

        {/* Pricing Structure with Live Net Take-Home Calculator */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Single Session Card */}
          <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4 space-y-3">
            <label className="block text-xs font-bold text-[var(--text)]">
              سعر الجلسة الفردية (ج.م)
            </label>
            <input
              type="number"
              min={50}
              max={5000}
              value={v.session_rate}
              onChange={(e) => update({ session_rate: Number(e.target.value) })}
              className="field w-full text-sm font-black font-mono"
            />
            {/* Live Net Breakdown */}
            <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-3)] p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[var(--muted-2)]">
                <span>عمولة المنصة (15%):</span>
                <span className="font-mono">-{sessionFee} ج.م</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[var(--line-soft)] font-bold text-emerald-400">
                <span>صافي تحويلك بالإنستاباي:</span>
                <span className="font-mono text-sm">+{sessionCoachNet} ج.م</span>
              </div>
            </div>
            <span className="block text-[10px] text-[var(--muted-2)]">
              قيمة الجلسة الواحدة (ساعة تدريبية معتمدة)
            </span>
          </div>

          {/* Package 8 Sessions Card */}
          <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[var(--text)]">
                سعر باقة 8 حصص (ج.م)
              </label>
              {packageDiscountPct > 0 && !packageBoundError && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                  توفير {packageDiscountPct}% للمتدرب
                </span>
              )}
            </div>
            <input
              type="number"
              min={50}
              max={50000}
              value={v.package_8_rate}
              onChange={(e) => update({ package_8_rate: Number(e.target.value) })}
              className={`field w-full text-sm font-black font-mono ${
                packageBoundError ? "border-rose-500 focus:border-rose-500" : ""
              }`}
            />
            {packageBoundError ? (
              <p className="rounded-xl bg-rose-500/10 p-2.5 text-[11px] text-rose-300 font-bold leading-5">
                ⚠️ {packageBoundError}
              </p>
            ) : (
              <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-3)] p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[var(--muted-2)]">
                  <span>عمولة المنصة (15%):</span>
                  <span className="font-mono">-{packageFee} ج.م</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--line-soft)] font-bold text-emerald-400">
                  <span>صافي تحويلك بالإنستاباي:</span>
                  <span className="font-mono text-sm">+{packageCoachNet} ج.م</span>
                </div>
                <div className="text-[10px] text-[var(--muted-2)] pt-1 flex justify-between">
                  <span>صافي الحصة في الباقة:</span>
                  <span className="font-mono font-bold text-cobalt-300">+{packageUnitNet} ج.م / حصة</span>
                </div>
              </div>
            )}
            <span className="block text-[10px] text-[var(--muted-2)]">
              باقة شهرية تشجع المتدرب على الالتزام وتضمن لك دخلاً مستقراً
            </span>
          </div>
        </div>

        {/* 4. Manual Settlement Details via InstaPay / Mobile Wallet */}
        <div className="rounded-2xl border border-cobalt-500/20 bg-cobalt-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-cobalt-300" />
            <h4 className="text-sm font-black text-[var(--text)]">
              بيانات التحويل والتسوية المالية اليدوية (إنستاباي / محفظة إلكترونية)
            </h4>
          </div>
          <p className="text-xs leading-6 text-[var(--muted)]">
            عملية تسوية وصرف مستحقاتك تتم يدويًا من إدارة المنصة فور إتمام وتأكيد حضور كل حصة تدريبية، وتُحوّل مباشرة إلى حسابك المسجل هنا (مثل نظام تحويل ودفع المتدربين اليدوي):
          </p>
          <div>
            <label className="block text-xs font-bold text-[var(--muted-2)] mb-1.5">
              عنوان إنستاباي (InstaPay IPA) أو رقم المحفظة (فودافون كاش / أورنج / اتصالات / وي)
            </label>
            <div className="relative">
              <input
                type="text"
                dir="ltr"
                value={v.instapay_address ?? ""}
                onChange={(e) => update({ instapay_address: e.target.value })}
                placeholder="example@instapay أو 01012345678"
                className="field w-full font-mono text-xs pl-3 pr-9"
              />
              <Wallet size={15} className="absolute right-3 top-3.5 text-[var(--muted-2)]" />
            </div>
            <span className="mt-1.5 block text-[10px] text-[var(--muted-2)]">
              تأكد من كتابة العنوان أو الرقم بدقة لتجنب أي تأخير في استلام أرباحك بعد انتهاء الحصص.
            </span>
          </div>
        </div>

        {/* 5. Smart Searchable Autocomplete: Sports */}
        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
          <SearchableCombobox
            label="الرياضات والتخصصات (اكتب للبحث أو اختر من القائمة)"
            options={sportsMasterList}
            selected={v.sports}
            onChange={(selectedSports) => update({ sports: selectedSports })}
            placeholder="اكتب أول أحرف من الرياضة (مثال: ك، ب، ت، س)..."
            allowCustom={true}
            maxItems={8}
          />
        </div>

        {/* 6. Smart Searchable Autocomplete: Governorates & Locations */}
        <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
          <SearchableCombobox
            label="المحافظات وأماكن التدريب المتاحة (اكتب للبحث أو اختر من القائمة)"
            options={EGYPT_GOVERNORATES}
            selected={v.training_locations}
            onChange={(selectedLocations) => update({ training_locations: selectedLocations })}
            placeholder="اكتب أول أحرف من المحافظة (مثال: ق، ج، إ، ط، م)..."
            allowCustom={true}
            maxItems={10}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold text-[var(--muted)]">
            نبذة عن خبراتك وأسلوبك التدريبي
          </label>
          <textarea
            value={v.bio}
            maxLength={2500}
            onChange={(e) => update({ bio: e.target.value })}
            placeholder="اكتب نبذة تشرح فيها خبراتك، الشهادات الحاصل عليها، الفئات التي تدربها (مبتدئين، متقدمين، أطفال، تأهيل إصابات)..."
            className="field mt-2 min-h-36 w-full py-3 text-xs leading-6"
          />
          <span className="mt-1 block text-[10px] text-[var(--muted-2)]">
            {v.bio.length} / 2500 حرف
          </span>
        </div>

        {/* Languages */}
        <div>
          <label className="block text-xs font-bold text-[var(--muted)]">
            اللغات التي تجيد التدريب بها (مفصولة بفاصلة)
          </label>
          <input
            value={v.languages.join("، ")}
            onChange={(e) =>
              update({
                languages: e.target.value
                  .split(/[،,]/)
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
            placeholder="مثال: العربية، English"
            className="field mt-2 w-full text-xs"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200">
            {error}
          </p>
        )}

        {ok && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300">
            <CheckCircle2 size={16} />
            <span>تم حفظ البيانات وتحديث ملفك الشخصي بنجاح.</span>
          </div>
        )}

        <button
          type="button"
          disabled={busy || Boolean(packageBoundError)}
          onClick={save}
          className="btn-cobalt min-h-12 w-full text-sm font-black shadow-lg shadow-[var(--cobalt)]/25 transition disabled:opacity-50"
        >
          <Save size={16} />
          {busy ? "جارٍ الحفظ..." : "حفظ وتحديث الملف الشخصي"}
        </button>
      </div>
    </div>
  );
}
