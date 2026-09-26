"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  calculatePackagePurchase,
  PACKAGE_VALID_DAYS,
} from "@/lib/pricing";

export async function purchasePackage(coachId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("لازم تسجل دخول أولاً");

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("id, package_8_rate, is_verified")
    .eq("id", coachId)
    .single();

  if (coachError || !coach) {
    throw new Error("المدرب غير موجود");
  }

  if (!coach.is_verified) {
    throw new Error("لا يمكن شراء باقة من مدرب غير موثّق");
  }

  const pricing = calculatePackagePurchase(coach.package_8_rate);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PACKAGE_VALID_DAYS);

  const { data, error } = await supabase
    .from("athlete_packages")
    .insert({
      athlete_id: user.id,
      coach_id: coachId,
      total_sessions: 8,
      remaining_sessions: 8,
      price_paid: pricing.totalPrice,
      status: "active",
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");

  return data;
}

export async function toggleAvailability(_currentValue: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("لازم تسجل دخول أولاً");

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("is_available_today")
    .eq("id", user.id)
    .single();

  if (coachError || !coach) {
    throw new Error("حساب المدرب غير موجود");
  }

  const { error } = await supabase
    .from("coaches")
    .update({
      is_available_today: !coach.is_available_today,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/dashboard");
}
