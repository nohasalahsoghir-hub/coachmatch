"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ManualBookingIntentResponse {
  booking_id: string;
  reference_code: string;
  coach_name: string;
  coach_sports: string[];
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
  subtotal: number;
  checkout_fee: number;
  total_amount: number;
  hold_expires_at: string;
  athlete_name: string;
  athlete_phone: string;
}

export async function createManualBookingIntent(input: {
  coachId: string;
  sessionDate: string;
  startTime: string;
  location: string;
}): Promise<ManualBookingIntentResponse> {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولًا");

  const { data, error } = await s.rpc("create_manual_booking_intent", {
    p_coach_id: input.coachId,
    p_session_date: input.sessionDate,
    p_start_time: input.startTime,
    p_location: input.location,
  });

  if (error) throw new Error(error.message);
  if (!data?.booking_id) throw new Error("تعذر إنشاء طلب الحجز");

  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
  revalidatePath("/admin");
  return data as ManualBookingIntentResponse;
}

export async function createBookingDirect(input: {
  coachId: string;
  sessionDate: string;
  startTime: string;
  location: string;
}) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولًا");

  const { data, error } = await s.rpc("create_booking_direct", {
    p_coach_id: input.coachId,
    p_session_date: input.sessionDate,
    p_start_time: input.startTime,
    p_location: input.location,
  });

  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.booking_id) throw new Error("تعذر تأكيد الحجز");

  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${input.coachId}`);
  return row;
}

export async function bookWithPackage(input: {
  packageId: string;
  coachId: string;
  sessionDate: string;
  startTime: string;
  location: string;
}) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولًا");

  const { data, error } = await s.rpc("book_with_package", {
    p_package_id: input.packageId,
    p_coach_id: input.coachId,
    p_session_date: input.sessionDate,
    p_start_time: input.startTime,
    p_location: input.location,
  });

  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.booking_id) throw new Error("تعذر استخدام الحصة");

  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  revalidatePath(`/coaches/${input.coachId}`);
  return row;
}

export async function cancelBooking(bookingId: string, reason = "") {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولًا");

  const { data, error } = await s.rpc("cancel_booking_v3", {
    p_booking_id: bookingId,
    p_reason: reason,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  revalidatePath("/admin");
  return Array.isArray(data) ? data[0] : data;
}

export async function completeBooking(bookingId: string) {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولًا");

  const { error } = await s.rpc("complete_booking_v3", {
    p_booking_id: bookingId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  revalidatePath("/admin");
  return { ok: true };
}
