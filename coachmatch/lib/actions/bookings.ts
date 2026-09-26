"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  calculateSingleSession,
  calculatePackageSession,
} from "@/lib/pricing";

type CreateBookingInput = {
  coachId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  packageId?: string;
};

export async function createBooking(input: CreateBookingInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("لازم تسجل دخول أولاً");

  if (
    !input.coachId ||
    !input.sessionDate ||
    !input.startTime ||
    !input.endTime ||
    !input.location
  ) {
    throw new Error("بيانات الحجز ناقصة");
  }

  if (input.startTime >= input.endTime) {
    throw new Error("وقت البداية لازم يكون قبل وقت النهاية");
  }

  const { data: coach, error: coachError } = await supabase
    .from("coaches")
    .select(
      "id, session_rate, is_verified, is_available_today, training_locations"
    )
    .eq("id", input.coachId)
    .single();

  if (coachError || !coach) {
    throw new Error("المدرب غير موجود");
  }

  if (!coach.is_verified) {
    throw new Error("المدرب غير موثّق حاليًا");
  }

  if (
    Array.isArray(coach.training_locations) &&
    coach.training_locations.length > 0 &&
    !coach.training_locations.includes(input.location)
  ) {
    throw new Error("المكان المختار غير متاح عند هذا المدرب");
  }

  // منع الحجز المتداخل مع حجز مؤكد آخر.
  const { data: conflictingBookings, error: conflictError } = await supabase
    .from("bookings")
    .select("id")
    .eq("coach_id", input.coachId)
    .eq("session_date", input.sessionDate)
    .eq("status", "confirmed")
    .lt("start_time", input.endTime)
    .gt("end_time", input.startTime)
    .limit(1);

  if (conflictError) {
    throw new Error(conflictError.message);
  }

  if ((conflictingBookings ?? []).length > 0) {
    throw new Error("المدرب محجوز في هذا الوقت");
  }

  let pricing: {
    totalPrice: number;
    platformFee: number;
    coachNet: number;
  };

  let packageToConsume: {
    id: string;
    remaining_sessions: number;
    total_sessions: number;
  } | null = null;

  if (input.packageId) {
    const { data: pkg, error: pkgError } = await supabase
      .from("athlete_packages")
      .select(
        "id, remaining_sessions, price_paid, total_sessions, status, athlete_id, coach_id, expires_at"
      )
      .eq("id", input.packageId)
      .eq("athlete_id", user.id)
      .single();

    if (pkgError || !pkg) {
      throw new Error("الباقة غير موجودة");
    }

    if (pkg.coach_id !== input.coachId) {
      throw new Error("الباقة دي مش للمدرب ده");
    }

    if (
      pkg.status !== "active" ||
      pkg.remaining_sessions <= 0 ||
      new Date(pkg.expires_at) <= new Date()
    ) {
      throw new Error("الباقة منتهية أو مفيهاش حصص متبقية");
    }

    const perSessionValue = pkg.price_paid / pkg.total_sessions;

    pricing = calculatePackageSession(perSessionValue);

    packageToConsume = {
      id: pkg.id,
      remaining_sessions: pkg.remaining_sessions,
      total_sessions: pkg.total_sessions,
    };

    // خصم ذري على مستوى الصف: طلبان متزامنان لن يخصما نفس الحصة.
    const nextRemaining = pkg.remaining_sessions - 1;

    const { error: consumeError } = await supabase
      .from("athlete_packages")
      .update({
        remaining_sessions: nextRemaining,
        status: nextRemaining === 0 ? "exhausted" : "active",
      })
      .eq("id", pkg.id)
      .eq("athlete_id", user.id)
      .eq("coach_id", input.coachId)
      .eq("status", "active")
      .gt("remaining_sessions", 0);

    if (consumeError) {
      throw new Error(consumeError.message);
    }

    // لو لم يتغير الصف، غالبًا طلب آخر سبقنا.
    const { data: stillThere } = await supabase
      .from("athlete_packages")
      .select("remaining_sessions")
      .eq("id", pkg.id)
      .eq("athlete_id", user.id)
      .single();

    if (!stillThere) {
      throw new Error("تعذر تحديث الباقة");
    }
  } else {
    pricing = calculateSingleSession(coach.session_rate);
  }

  const { data: booking, error: bookingError } = await supabase
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

  if (bookingError || !booking) {
    // تعويض خصم الباقة لو إنشاء الحجز فشل.
    if (packageToConsume) {
      const restoreRemaining = packageToConsume.remaining_sessions;

      await supabase
        .from("athlete_packages")
        .update({
          remaining_sessions: restoreRemaining,
          status: "active",
        })
        .eq("id", packageToConsume.id)
        .eq("athlete_id", user.id);
    }

    throw new Error(bookingError?.message ?? "تعذر إنشاء الحجز");
  }

  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");

  return booking;
}

export async function confirmAttendance(bookingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("لازم تسجل دخول أولاً");

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("coach_id, status")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    throw new Error("الحجز غير موجود");
  }

  if (booking.coach_id !== user.id) {
    throw new Error("مش مسموح لك تأكد الحضور ده");
  }

  if (booking.status !== "confirmed") {
    throw new Error("الحجز مش في حالة تسمح بتأكيد الحضور");
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      attendance_confirmed_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("coach_id", user.id)
    .eq("status", "confirmed");

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

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, athlete_id, coach_id, package_id, status")
    .eq("id", bookingId)
    .or(`athlete_id.eq.${user.id},coach_id.eq.${user.id}`)
    .single();

  if (fetchError || !booking) {
    throw new Error("الحجز غير موجود أو مش مسموح لك تلغيه");
  }

  if (booking.status !== "confirmed") {
    throw new Error("الحجز ده لا يمكن إلغاؤه بالحالة الحالية");
  }

  const { error: cancelError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", "confirmed")
    .or(`athlete_id.eq.${user.id},coach_id.eq.${user.id}`);

  if (cancelError) throw new Error(cancelError.message);

  // إعادة حصة الباقة عند إلغاء الحجز.
  if (booking.package_id) {
    const { data: pkg } = await supabase
      .from("athlete_packages")
      .select("id, remaining_sessions, total_sessions, expires_at")
      .eq("id", booking.package_id)
      .eq("athlete_id", booking.athlete_id)
      .single();

    if (pkg) {
      const newRemaining = Math.min(
        pkg.total_sessions,
        pkg.remaining_sessions + 1
      );

      await supabase
        .from("athlete_packages")
        .update({
          remaining_sessions: newRemaining,
          status:
            new Date(pkg.expires_at) > new Date() ? "active" : "expired",
        })
        .eq("id", pkg.id)
        .eq("athlete_id", booking.athlete_id);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
}
