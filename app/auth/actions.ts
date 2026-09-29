"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkPwnedPassword } from "@/lib/security/pwned-password";

type ActionState = { error: string | null; submitted?: boolean };
const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*\d).{8,}$/;

export async function signUp(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "athlete");
  const termsAccepted = formData.get("terms_accepted") === "on";

  if (!email || !password || !confirmPassword || !fullName || !phone) return { error: "من فضلك املأ كل البيانات المطلوبة" };
  if (!STRONG_PASSWORD_REGEX.test(password)) return { error: "كلمة المرور لازم تكون 8 أحرف على الأقل وتحتوي على رقم واحد على الأقل" };
  if (password !== confirmPassword) return { error: "كلمتا المرور غير متطابقتين" };
  try {
    const pwned = await checkPwnedPassword(password);
    if (pwned.compromised) return { error: "كلمة المرور دي ظهرت في تسريبات معروفة. اختاري كلمة مرور مختلفة." };
  } catch {
    return { error: "تعذر التحقق من أمان كلمة المرور الآن. حاولي مرة أخرى." };
  }
  if (!termsAccepted) return { error: "لازم توافق على شروط الاستخدام وسياسة الخصوصية قبل إنشاء الحساب" };
  if (!EGYPT_PHONE_REGEX.test(phone)) return { error: "رقم الهاتف غير صحيح (مثال: 01012345678)" };
  if (role !== "athlete" && role !== "coach") return { error: "نوع الحساب غير صالح" };

  const s = await createClient();
  const { data, error } = await s.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone, role } },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "تعذر إنشاء الحساب" };

  revalidatePath("/", "layout");

  if (!data.session) redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  redirect(role === "coach" ? "/coach/dashboard" : "/dashboard");
}

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "اكتب البريد الإلكتروني وكلمة المرور" };

  const s = await createClient();
  const { error } = await s.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed" || error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "لم يتم تأكيد البريد الإلكتروني. افتح رسالة التأكيد واضغط على الرابط قبل تسجيل الدخول." };
    }
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
  }

  const { data: { user } } = await s.auth.getUser();
  if (!user) return { error: "تعذر قراءة جلسة الدخول" };

  const { data: profile } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  revalidatePath("/", "layout");

  if (profile?.role === "coach") redirect("/coach/dashboard");
  redirect("/dashboard");
}

export async function requestPasswordReset(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "اكتب بريدك الإلكتروني", submitted: false };
  const s = await createClient();
  const { error } = await s.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/auth/callback?next=/auth/reset-password`,
  });
  if (error) return { error: error.message, submitted: false };
  return { error: null, submitted: true };
}

export async function updatePassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  if (!STRONG_PASSWORD_REGEX.test(password)) return { error: "كلمة المرور لازم تكون 8 أحرف على الأقل وتحتوي على رقم واحد على الأقل" };
  if (password !== confirmPassword) return { error: "كلمتا المرور غير متطابقتين" };
  try {
    const pwned = await checkPwnedPassword(password);
    if (pwned.compromised) return { error: "كلمة المرور دي ظهرت في تسريبات معروفة. اختاري كلمة مرور مختلفة." };
  } catch {
    return { error: "تعذر التحقق من أمان كلمة المرور الآن. حاولي مرة أخرى." };
  }

  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return { error: "جلسة إعادة التعيين غير صالحة أو انتهت. اطلب رابطًا جديدًا." };
  const { error } = await s.auth.updateUser({ password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/auth/login?reset=success");
}

export async function logout() {
  const s = await createClient();
  await s.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
