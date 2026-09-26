"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculatePackagePurchase, PACKAGE_VALID_DAYS } from "@/lib/pricing";

/**
 * Athlete buys an 8-session package from a coach.
 * Commission is taken up-front on the full package price.
 * (Actual payment capture — InstaPay/card — happens before this is called;
 * this records the purchase once payment is confirmed.)
 */
export async function purchasePackage(coachId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("لازم تسجل دخول أولاً");

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("package_8_rate")
    .eq("id", coachId)
    .single();
  if (coachError || !coach) throw new Error("المدرب غير موجود");

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

/** Coach flips their own "available today" switch. */
export async function toggleAvailability(currentValue: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("لازم تسجل دخول أولاً");

  const { error } = await supabase
    .from("coaches")
    .update({ is_available_today: !currentValue })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/coach/dashboard");
}
