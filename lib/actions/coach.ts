"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setCoachAvailability(isAvailable: boolean) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error("لازم تسجل دخول أولًا");

  const { error } = await supabase
    .from("coaches")
    .update({ is_available_today: isAvailable })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
}
