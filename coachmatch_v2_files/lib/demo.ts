"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createDemoBooking(input: {
  coachId: string;
  sessionDate: string;
  startTime: string;
  location: string;
  idempotencyKey: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("create_demo_booking_atomic", {
    p_coach_id: input.coachId,
    p_session_date: input.sessionDate,
    p_start_time: input.startTime,
    p_location: input.location,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("تعذر إنشاء الحجز التجريبي");
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${input.coachId}`);
  revalidatePath("/demo");
  revalidatePath("/demo/athlete");
  revalidatePath("/demo/coach");
  revalidatePath("/demo/admin");
  return row;
}

export async function purchaseDemoPackage(coachId: string, idempotencyKey: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("purchase_demo_package_atomic", {
    p_coach_id: coachId,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("تعذر إنشاء الباقة التجريبية");
  revalidatePath("/demo");
  revalidatePath("/demo/athlete");
  revalidatePath("/demo/admin");
  return row;
}
