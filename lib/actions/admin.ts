"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function assertAdmin() {
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) throw new Error("يجب تسجيل الدخول أولاً");

  const { data: profile } = await s.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    throw new Error("غير مصرح لك بالوصول: هذا الإجراء متاح لمدير المنصة فقط");
  }
  return user.id;
}

export async function adminConfirmManualBooking(
  bookingId: string,
  paymentMethod = "instapay",
  notes = ""
) {
  await assertAdmin();
  const s = await createClient();

  const { data, error } = await s.rpc("admin_confirm_manual_booking", {
    p_booking_id: bookingId,
    p_payment_method: paymentMethod,
    p_transfer_reference: notes ? `MANUAL-${notes}` : null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  return data;
}

export async function adminRejectManualBooking(
  bookingId: string,
  reason = "لم يتم استلام التحويل عبر واتساب"
) {
  await assertAdmin();
  const s = await createClient();

  const { data, error } = await s.rpc("admin_reject_manual_booking", {
    p_booking_id: bookingId,
    p_reason: reason,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
  revalidatePath("/coaches");
  return data;
}

export async function reviewCoachVerification(
  id: string,
  status: "approved" | "rejected" | "needs_changes",
  reason = ""
) {
  const adminId = await assertAdmin();
  const service = createServiceClient();

  const { data: r, error: e } = await service
    .from("coach_verification_requests")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      rejection_reason: status === "rejected" || status === "needs_changes" ? reason || "يرجى مراجعة البيانات" : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("coach_id")
    .single();

  if (e) throw new Error(e.message);

  const isVerified = status === "approved";
  await service.from("coaches").update({ is_verified: isVerified }).eq("id", r.coach_id);

  const { data: coach } = await service.from("coaches").select("is_demo").eq("id", r.coach_id).maybeSingle();
  await service.from("notifications").insert({
    user_id: r.coach_id,
    type: "verification",
    title: status === "approved" ? "تم توثيق حسابك بنجاح ✅" : "تحديث بخصوص طلب التوثيق",
    body: status === "approved" ? "أصبح ملفك موثقاً ومؤهلاً لاستقبال المتدربين في الكتالوج." : reason || "يرجى مراجعة وتحديث بيانات التوثيق.",
    link: "/coach/dashboard",
    is_demo: Boolean(coach?.is_demo),
  });

  revalidatePath("/admin");
  revalidatePath("/coaches");
  return { ok: true };
}

export async function resolveDispute(
  id: string,
  resolution: string,
  status: "resolved" | "rejected"
) {
  await assertAdmin();
  const service = createServiceClient();

  if (!resolution.trim()) throw new Error("يرجى كتابة ملخص القرار قبل الحفظ");

  const { data: d, error: de } = await service.from("disputes").select("id, booking_id").eq("id", id).maybeSingle();
  if (de || !d) throw new Error(de?.message || "النزاع غير موجود");

  const { error: e } = await service
    .from("disputes")
    .update({
      status,
      resolution: resolution.trim(),
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (e) throw new Error(e.message);

  const { data: b } = await service.from("bookings").select("athlete_id, coach_id, is_demo").eq("id", d.booking_id).maybeSingle();
  if (b) {
    await service.from("notifications").insert([
      {
        user_id: b.athlete_id,
        type: "system",
        title: "تم تحديث قرار النزاع",
        body: resolution.trim(),
        link: "/dashboard",
        is_demo: Boolean(b.is_demo),
      },
      {
        user_id: b.coach_id,
        type: "system",
        title: "تم تحديث قرار النزاع",
        body: resolution.trim(),
        link: "/coach/dashboard",
        is_demo: Boolean(b.is_demo),
      },
    ]);
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/coach/dashboard");
  return { ok: true };
}
