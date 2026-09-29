"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function activatePackage(coachId: string) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("لازم تسجل دخول أولًا");
  const { data, error } = await s.rpc("activate_package_direct", { p_coach_id: coachId });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.package_id) throw new Error("تعذر تفعيل الباقة التجريبية");
  revalidatePath("/dashboard");
  revalidatePath(`/coaches/${coachId}`);
  return row;
}
