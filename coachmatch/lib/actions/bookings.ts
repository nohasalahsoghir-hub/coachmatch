"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateSingleSession, calculatePackageSession } from "@/lib/pricing";

type CreateBookingInput = {
  coachId: string;
  sessionDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  packageId?: string; // if booking from an already-purchased package
};

export async function createBooking(input: CreateBookingInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("لازم تسجل دخول أولاً");

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select("session_rate")
    .eq("id", input.coachId)
    .single();
  if (coachError || !coach) throw new Error("المدرب غير موجود");

  let pricing;

  if (input.packageId) {
    // Booking a session out of a package the athlete already paid for.
    const { data: pkg, error: pkgError } = await supabase
      .from("athlete_packages")
      .select("id, remaining_sessions, price_paid, total_sessions, status, athlete_id")
      .eq("id", input.packageId)
      .single();

    if (pkgError || !pkg) throw new Error("الباقة غير موجودة");
    if (pkg.athlete_id !== user.id) throw new Error("الباقة دي مش بتاعتك");
    if (pkg.status !== "active" || pkg.remaining_sessions <= 0) {
      throw new Error("الباقة منتهية أو مفيهاش حصص متبقية");
    }

    const perSessionValue = pkg.price_paid / pkg.total_sessions;
    pricing = { ...calculatePackageSession(perSessionValue) };

    // Deduct the session from the package immediately (reserves the slot).
    const remaining = pkg.remaining_sessions - 1;
    const { error: updateError } = await supabase
      .from("athlete_packages")
      .update({
        remaining_sessions: remaining,
        status: remaining === 0 ? "exhausted" : "active",
      })
      .eq("id", pkg.id);
    if (updateError) throw new Error(updateError.message);
  } else {
    pricing = calculateSingleSession(coach.session_rate);
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      athlete_id: user.id,
      coach_id: input.coachId,
      package_id: input.packageId ?? null,
      session_date: input.sessionDate,
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.location,
      status: "confirmed",
      total_price: pricing.totalPrice,
      platform_fee: pricing.platformFee,
      coach_net: pricing.coachNet,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
  return booking;
}

/** Coach (or a QR scan endpoint acting on their behalf) confirms a session happened. */
export async function confirmAttendance(bookingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("لازم تسجل دخول أولاً");

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("coach_id")
    .eq("id", bookingId)
    .single();
  if (fetchError || !booking) throw new Error("الحجز غير موجود");
  if (booking.coach_id !== user.id) throw new Error("مش مسموح لك تأكد الحضور ده");

  const { error } = await supabase
    .from("bookings")
    .update({ status: "completed", attendance_confirmed_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);

  revalidatePath("/coach/dashboard");
  revalidatePath("/dashboard");
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("لازم تسجل دخول أولاً");

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .or(`athlete_id.eq.${user.id},coach_id.eq.${user.id}`);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
}
