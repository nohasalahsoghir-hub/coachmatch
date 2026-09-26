"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error: string | null };

const EGYPT_PHONE_REGEX = /^01[0125][0-9]{8}$/;

/**
 * Creates a new auth user. The DB trigger `on_auth_user_created` reads
 * `full_name`, `phone`, and `role` from user_metadata and inserts the
 * matching row into `public.profiles` automatically.
 */
export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const role = (formData.get("role") as string) || "athlete";

  if (!EGYPT_PHONE_REGEX.test(phone)) {
    return { error: "رقم الهاتف غير صحيح (مثال: 01012345678)" };
  }
  if (role !== "athlete" && role !== "coach") {
    return { error: "نوع الحساب غير صالح" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone, role },
    },
  });

  if (error) return { error: error.message };

  // If the user selected "coach", create the linked coaches row too.
  if (role === "coach" && data.user) {
    await (supabase.from("coaches") as any).insert({ id: data.user.id });
  }

  revalidatePath("/", "layout");
  redirect(role === "coach" ? "/coach/dashboard" : "/dashboard");
}

export async function login(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "بيانات الدخول غير صحيحة" };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}


