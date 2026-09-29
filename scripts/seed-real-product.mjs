import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Supabase server credentials are missing in .env.local");
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const PASSWORD = process.env.COACHMATCH_SEED_PASSWORD?.trim() || randomBytes(18).toString("base64url");
const SEED_FLAG = true;
const TARGET_DEMO_COACHES = 20;
const SLOT_STARTS = ["08:00","10:00","12:00","14:00","16:00","18:00","20:00"];
let userCache = null;

async function must(label, op) {
  const r = await op();
  if (r.error) throw new Error(`${label}: ${r.error.message}`);
  return r.data;
}

async function userByEmail(email) {
  if (!userCache) {
    const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    userCache = new Map((data.users || []).map((u) => [u.email, u]));
  }
  return userCache.get(email) || null;
}

async function ensureUser(email, fullName, phone, role) {
  const existing = await userByEmail(email);
  if (existing) {
    const { data, error } = await db.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, role },
    });
    if (error) throw error;
    return data.user;
  }
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone, role },
  });
  if (error) throw error;
  return data.user;
}

async function resetLegacyDemoTables() {
  for (const table of [
    "demo_money_ledger", "demo_reviews", "demo_disputes", "demo_payouts", "demo_payments",
    "demo_bookings", "demo_packages", "demo_notifications", "demo_verification_requests",
    "demo_coach_availability", "demo_coaches", "demo_athletes"
  ]) {
    await must(`reset legacy ${table}`, () => db.from(table).delete().eq("is_demo", true));
  }
}

async function resetSeedTransactions() {
  await must("reset checkout intents", () => db.from("booking_checkout_intents").delete().like("idempotency_key", "CM-SEED-%"));
  await must("reset seeded checkout intents", () => db.from("booking_checkout_intents").delete().filter("metadata->>seed", "eq", "true"));
  for (const table of [
    "disputes",
    "notifications",
    "reviews",
    "package_usage",
    "money_ledger",
    "payments",
    "payouts",
    "athlete_packages",
    "bookings",
    "coach_verification_requests",
  ]) {
    await must(`reset ${table}`, () => db.from(table).delete().eq("is_demo", SEED_FLAG));
  }
}

async function ensureSeedCoachPool(coachUserId, sports) {
  const existing = await must("seed coaches", () => db.from("coaches").select("id").eq("is_demo", true).order("created_at", { ascending: true }));
  const ids = new Set((existing || []).map((r) => r.id));
  if (!ids.has(coachUserId)) {
    await must("seed coach profile", () => db.from("profiles").upsert({
      id: coachUserId,
      linked_auth_id: coachUserId,
      full_name: "مروان حسن",
      phone: "01180090003",
      role: "coach",
      is_demo: true,
    }, { onConflict: "id" }));
    await must("seed coach", () => db.from("coaches").upsert({
      id: coachUserId,
      bio: "مدرب لياقة متخصص في تطوير القوة واللياقة بخطة شخصية قابلة للقياس.",
      sports: [sports[0].name_ar],
      session_rate: 320,
      package_8_rate: 2260,
      training_locations: ["القاهرة", "الجيزة"],
      is_verified: true,
      is_available_today: true,
      rating: 4.8,
      total_reviews: 34,
      is_demo: true,
      experience_years: 7,
      headline: "لياقة وقوة · خطة تدريب شخصية",
      languages: ["العربية", "English"],
    }, { onConflict: "id" }));
    existing.push({ id: coachUserId });
  }

  const removeCount = Math.max(0, existing.length - TARGET_DEMO_COACHES);
  if (removeCount > 0) {
    const removable = existing.filter((r) => r.id !== coachUserId).slice(-removeCount);
    for (const row of removable) {
      await db.from("coach_availability").delete().eq("coach_id", row.id).eq("is_demo", true);
      await db.from("coach_sports").delete().eq("coach_id", row.id).eq("is_demo", true);
      await db.from("coaches").delete().eq("id", row.id).eq("is_demo", true);
      await db.from("profiles").delete().eq("id", row.id).eq("is_demo", true);
    }
  }

  const rows = await must("final seed coaches", () => db.from("coaches").select("id").eq("is_demo", true).order("created_at", { ascending: true }));
  const firstNames = ["أحمد","عمر","يوسف","محمد","محمود","علي","زياد","كريم","عمرو","حسن","خالد","سيف","طارق","شريف","إسلام","ياسين","عبدالله","رامي","مروان","أنس","بدر","حسام","وليد","فارس","مازن","زين","إياد","حازم","آدم","مصطفى"];
  const lastNames = ["عادل","حسن","السيد","إبراهيم","سالم","محمود","حمدي","منصور","علي","خليل","أمين","صالح"];
  const cities = ["القاهرة","الجيزة","الإسكندرية","المنصورة","طنطا","الزقازيق","أسيوط","سوهاج","الأقصر","قنا","أسوان","بورسعيد"];
    const targetEmails = ["coach.seed@coachmatch.test", ...Array.from({ length: TARGET_DEMO_COACHES - 1 }, (_, i) => `coach.seed.${String(i + 1).padStart(3, "0")}@coachmatch.test`)];
  const targetIds = [];
  for (let idx = 0; idx < targetEmails.length; idx++) {
    const email = targetEmails[idx];
    const fullName = idx === 0 ? "مروان حسن" : `${firstNames[(idx - 1) % firstNames.length]} ${lastNames[Math.floor((idx - 1) / firstNames.length) % lastNames.length]}`;
    const phone = `011900${String(idx + 1).padStart(5, "0")}`;
    const authUser = await ensureUser(email, fullName, phone, "coach");
    const sport = seededSports[idx % seededSports.length];
    const rate = idx === 0 ? 320 : 180 + (idx % 10) * 40 + (idx % 3) * 15;
    targetIds.push(authUser.id);
    await must("seed profile", () => db.from("profiles").upsert({ id: authUser.id, linked_auth_id: authUser.id, full_name: fullName, phone, role: "coach", is_demo: true }, { onConflict: "id" }));
    await must("seed coach", () => db.from("coaches").upsert({
      id: authUser.id,
      bio: `مدرب ${sport.name_ar} متخصص في تطوير الأداء وبناء خطة تدريب قابلة للقياس.`,
      sports: [sport.name_ar],
      session_rate: rate,
      package_8_rate: idx === 0 ? 2260 : rate * 8 - Math.round(rate * 0.7),
      training_locations: [cities[idx % cities.length], cities[(idx + 3) % cities.length]],
      is_verified: true,
      is_available_today: idx % 7 !== 0,
      rating: Number((4.5 + (idx % 6) * 0.1).toFixed(2)),
      total_reviews: 12 + ((idx * 7) % 89),
      is_demo: true,
      experience_years: idx === 0 ? 7 : 2 + (idx % 12),
      headline: `${sport.name_ar} · ${idx % 2 === 0 ? "تطوير أداء" : "لياقة ونتائج"}`,
      languages: idx % 3 === 0 ? ["العربية", "English"] : ["العربية"],
    }, { onConflict: "id" }));
  }
  const extras = await must("extra seeded coaches", () => db.from("coaches").select("id").eq("is_demo", true).not("id", "in", `(${targetIds.join(",")})`));
  for (const row of extras || []) {
    await db.from("coach_availability").delete().eq("coach_id", row.id).eq("is_demo", true);
    await db.from("coach_sports").delete().eq("coach_id", row.id).eq("is_demo", true);
    await db.from("coaches").delete().eq("id", row.id).eq("is_demo", true);
    await db.from("profiles").delete().eq("id", row.id).eq("is_demo", true);
  }

  const finalCoaches = await must("seed coach list", () => db.from("coaches").select("id").eq("is_demo", true).order("created_at", { ascending: true }).limit(TARGET_DEMO_COACHES));
  await must("reset seed coach sports", () => db.from("coach_sports").delete().eq("is_demo", true));
  await must("reset seed availability", () => db.from("coach_availability").delete().eq("is_demo", true));

  const sportsRows = [];
  const availabilityRows = [];
  for (let i = 0; i < finalCoaches.length; i++) {
    const coachId = finalCoaches[i].id;
    const sport = seededSports[i % seededSports.length];
    sportsRows.push({ coach_id: coachId, sport_id: sport.id, specialization: sport.name_ar, is_primary: true, is_demo: true });
    for (let day = 0; day < SLOT_STARTS.length; day++) {
      const hour = Number(SLOT_STARTS[day].slice(0, 2));
      availabilityRows.push({ coach_id: coachId, day_of_week: day, start_time: SLOT_STARTS[day], end_time: `${String(hour + 1).padStart(2, "0")}:00`, timezone: "Africa/Cairo", is_active: true, is_demo: true });
    }
  }
  for (let i = 0; i < sportsRows.length; i += 50) await must("seed coach sports", () => db.from("coach_sports").insert(sportsRows.slice(i, i + 50)));
  for (let i = 0; i < availabilityRows.length; i += 100) await must("seed availability", () => db.from("coach_availability").insert(availabilityRows.slice(i, i + 100)));
  return finalCoaches.map((r) => r.id);
}

async function addLedgerRows({ bookingId = null, paymentId, athleteId, coachId, total, fee, commission, net, reference, refund = false, includeCoachReserve = false }) {
  const rows = [
    { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "charge", direction: "debit", amount: total, reference, metadata: { seed: true }, account_type: "payment_processor", is_demo: true },
    { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "charge", direction: "credit", amount: total, reference, metadata: { seed: true }, account_type: "platform_clearing", is_demo: true },
    { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "checkout_fee", direction: "debit", amount: fee, reference, metadata: { seed: true }, account_type: "platform_clearing", is_demo: true },
    { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "checkout_fee", direction: "credit", amount: fee, reference, metadata: { seed: true }, account_type: "platform_revenue", is_demo: true },
    { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "platform_commission", direction: "debit", amount: commission, reference, metadata: { seed: true }, account_type: "platform_clearing", is_demo: true },
    { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "platform_commission", direction: "credit", amount: commission, reference, metadata: { seed: true }, account_type: "platform_revenue", is_demo: true },
  ];
  if (includeCoachReserve) {
    rows.push(
      { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "coach_payout", direction: "debit", amount: net, reference, metadata: { seed: true, stage: "earned" }, account_type: "platform_clearing", is_demo: true },
      { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "coach_payout", direction: "credit", amount: net, reference, metadata: { seed: true, stage: "earned" }, account_type: "coach_payable", account_id: coachId, is_demo: true },
    );
  }
  if (refund) {
    rows.push(
      { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "refund", direction: "debit", amount: fee, reference: `${reference}-REFUND`, metadata: { seed: true }, account_type: "platform_revenue", is_demo: true },
      { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "refund", direction: "debit", amount: commission, reference: `${reference}-REFUND`, metadata: { seed: true }, account_type: "platform_revenue", is_demo: true },
      { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "refund", direction: "debit", amount: net, reference: `${reference}-REFUND`, metadata: { seed: true }, account_type: includeCoachReserve ? "coach_payable" : "platform_clearing", account_id: includeCoachReserve ? coachId : null, is_demo: true },
      { booking_id: bookingId, payment_id: paymentId, athlete_id: athleteId, coach_id: coachId, entry_type: "refund", direction: "credit", amount: total, reference: `${reference}-REFUND`, metadata: { seed: true }, account_type: "payment_processor", is_demo: true },
    );
  }
  await must("ledger", () => db.from("money_ledger").insert(rows));
}

async function seed() {
  await resetLegacyDemoTables();
  await resetSeedTransactions();
  const athlete = await ensureUser("athlete.seed@coachmatch.test", "نور أحمد", "01180090001", "athlete");
    const coachUser = await ensureUser("coach.seed@coachmatch.test", "مروان حسن", "01180090003", "coach");

  await must("athlete profile", () => db.from("profiles").upsert({ id: athlete.id, linked_auth_id: athlete.id, full_name: "نور أحمد", phone: "01180090001", role: "athlete", is_demo: true }, { onConflict: "id" }));

  const sports = await must("sports", () => db.from("sports").select("id,name_ar,slug").eq("is_active", true).order("sort_order"));
  if (sports.length < 5) throw new Error("بيانات الرياضات غير مكتملة");
  const seededSports = sports.slice(0, 5);

  const coachIds = await ensureSeedCoachPool(coachUser.id, seededSports);
  const coach1 = await must("coach1", () => db.from("coaches").select("id,session_rate,package_8_rate,training_locations").eq("id", coachUser.id).single());
  const coach2 = await must("coach2", () => db.from("coaches").select("id,session_rate,training_locations").in("id", coachIds.filter((id) => id !== coachUser.id)).order("created_at").limit(1).single());
  const coach3 = coachIds.find((id) => id !== coachUser.id && id !== coach2.id) || coach2.id;
  const coach3Row = await must("coach3", () => db.from("coaches").select("id,session_rate,training_locations").eq("id", coach3).single());

  const now = new Date();
  const past = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10);
  const past2 = new Date(now.getTime() - 1 * 86400000).toISOString().slice(0, 10);
  const upcoming = new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10);
  const cancelled = new Date(now.getTime() + 4 * 86400000).toISOString().slice(0, 10);

  const packageBase = Number(coach1.package_8_rate);
  const packageFee = 10;
  const packageTotal = packageBase + packageFee;
  const packageComm = Math.round(packageBase * 0.15 * 100) / 100;
  const packageSessionNet = Math.round((packageBase / 8 - (packageBase / 8) * 0.15) * 100) / 100;
  const pkg = await must("seed package", () => db.from("athlete_packages").insert({ athlete_id: athlete.id, coach_id: coach1.id, total_sessions: 8, remaining_sessions: 6, price_paid: packageTotal, subtotal: packageBase, checkout_fee: packageFee, platform_commission: packageComm, session_unit_price: Math.round((packageBase / 8) * 100) / 100, session_coach_net: packageSessionNet, status: "active", expires_at: new Date(now.getTime() + 75 * 86400000).toISOString(), is_demo: true }).select("id").single());
  const pkgPay = await must("seed package payment", () => db.from("payments").insert({ athlete_id: athlete.id, coach_id: coach1.id, package_id: pkg.id, provider: "sandbox", provider_reference: "CM-SEED-PACKAGE", amount: packageTotal, currency: "EGP", status: "paid", metadata: { seed: true, kind: "package" }, paid_at: now.toISOString(), is_demo: true }).select("id").single());
  await addLedgerRows({ paymentId: pkgPay.id, athleteId: athlete.id, coachId: coach1.id, total: packageTotal, fee: packageFee, commission: packageComm, net: 0, reference: "CM-SEED-PACKAGE", includeCoachReserve: false });

  async function packageBooking(date, start, ref, rating = false) {
    const sessionBase = Math.round((packageBase / 8) * 100) / 100;
    const sessionComm = Math.round(sessionBase * 0.15 * 100) / 100;
    const sessionNet = Math.round((sessionBase - sessionComm) * 100) / 100;
    const end = `${String(Number(start.slice(0, 2)) + 1).padStart(2, "0")}:00`;
    const b = await must("package booking", () => db.from("bookings").insert({ athlete_id: athlete.id, coach_id: coach1.id, package_id: pkg.id, session_date: date, start_time: start, end_time: end, location: coach1.training_locations[0], status: "confirmed", total_price: sessionBase, platform_fee: 0, coach_net: sessionNet, payment_status: "paid", subtotal: sessionBase, checkout_fee: 0, platform_commission: sessionComm, total_amount: 0, timezone: "Africa/Cairo", is_demo: true }).select("id").single());
    await must("complete package booking", () => db.from("bookings").update({ status: "completed", attendance_confirmed_at: new Date(now.getTime() - 86400000).toISOString() }).eq("id", b.id));
    await must("package use", () => db.from("package_usage").insert({ package_id: pkg.id, booking_id: b.id, sessions_used: 1, used_at: now.toISOString(), is_demo: true }));
    await must("package earning ledger", () => db.from("money_ledger").insert([
      { booking_id: b.id, payment_id: pkgPay.id, athlete_id: athlete.id, coach_id: coach1.id, entry_type: "coach_payout", direction: "debit", amount: sessionNet, reference: `${ref}-EARN`, metadata: { seed: true, stage: "earned" }, account_type: "platform_clearing", is_demo: true },
      { booking_id: b.id, payment_id: pkgPay.id, athlete_id: athlete.id, coach_id: coach1.id, entry_type: "coach_payout", direction: "credit", amount: sessionNet, reference: `${ref}-EARN`, metadata: { seed: true, stage: "earned" }, account_type: "coach_payable", account_id: coach1.id, is_demo: true },
    ]));
    await must("package payout", () => db.from("payouts").insert({
      coach_id: coach1.id, amount: sessionNet, currency: "EGP", status: ref.endsWith("001") ? "paid" : "pending",
      period_start: date, period_end: date, payout_reference: `${ref}-PAYOUT`,
      paid_at: ref.endsWith("001") ? now.toISOString() : null, is_demo: true
    }));
    if (rating) await must("seed review", () => db.from("reviews").insert({ booking_id: b.id, athlete_id: athlete.id, coach_id: coach1.id, rating: 5, comment: "المدرب منظم والشرح واضح والخطة مناسبة.", is_demo: true }));
  }
  await packageBooking(past, "10:00", "CM-SEED-PKG-001");
  await packageBooking(past2, "12:00", "CM-SEED-PKG-002", true);

  await must("package payout settlement", () => db.from("money_ledger").insert([
    { booking_id: null, payment_id: pkgPay.id, athlete_id: athlete.id, coach_id: coach1.id, entry_type: "coach_payout", direction: "debit", amount: packageSessionNet, reference: "CM-SEED-PKG-001-PAYOUT", metadata: { seed: true, stage: "payout" }, account_type: "coach_payable", account_id: coach1.id, is_demo: true },
    { booking_id: null, payment_id: pkgPay.id, athlete_id: athlete.id, coach_id: coach1.id, entry_type: "coach_payout", direction: "credit", amount: packageSessionNet, reference: "CM-SEED-PKG-001-PAYOUT", metadata: { seed: true, stage: "payout" }, account_type: "payment_processor", is_demo: true },
  ]));

  async function singleBooking(coach, date, start, ref, status, refund = false) {
    const base = Number(coach.session_rate);
    const fee = 10;
    const commission = Math.round(base * 0.15 * 100) / 100;
    const net = Math.round((base - commission) * 100) / 100;
    const total = base + fee;
    const end = `${String(Number(start.slice(0, 2)) + 1).padStart(2, "0")}:00`;
    const b = await must("single booking", () => db.from("bookings").insert({
      athlete_id: athlete.id, coach_id: coach.id, session_date: date, start_time: start, end_time: end,
      location: coach.training_locations[0], status, total_price: base, platform_fee: fee, coach_net: net,
      payment_status: refund ? "refunded" : "paid", subtotal: base, checkout_fee: fee, platform_commission: commission,
      total_amount: total, timezone: "Africa/Cairo", is_demo: true,
      cancellation_reason: refund ? "إلغاء قبل الموعد" : null, cancelled_at: refund ? now.toISOString() : null,
      cancelled_by: refund ? athlete.id : null, refund_amount: refund ? total : 0, refunded_at: refund ? now.toISOString() : null,
    }).select("id").single());
    const payment = await must("single payment", () => db.from("payments").insert({
      athlete_id: athlete.id, coach_id: coach.id, booking_id: b.id, provider: "sandbox", provider_reference: ref,
      amount: total, currency: "EGP", status: refund ? "refunded" : "paid", metadata: { seed: true }, paid_at: now.toISOString(),
      refunded_amount: refund ? total : 0, refunded_at: refund ? now.toISOString() : null, is_demo: true,
    }).select("id").single());
    await addLedgerRows({ bookingId: b.id, paymentId: payment.id, athleteId: athlete.id, coachId: coach.id, total, fee, commission, net, reference: ref, refund });
    return { id: b.id, base, fee, commission, net, total, paymentId: payment.id };
  }

  const upcomingBooking = await singleBooking(coach1, upcoming, "16:00", "CM-SEED-UPCOMING", "confirmed");
  await singleBooking(coach3Row, cancelled, "18:00", "CM-SEED-REFUND", "cancelled", true);


  await must("notifications", () => db.from("notifications").insert([
    { user_id: athlete.id, type: "booking", title: "تم تأكيد حجزك", body: "تم تأكيد جلستك القادمة بعد نجاح الدفع.", link: "/dashboard", is_demo: true },
    { user_id: athlete.id, type: "package", title: "باقتك فعالة", body: "لديك 6 حصص متبقية مع مدربك.", link: "/dashboard", is_demo: true },
    { user_id: coach1.id, type: "booking", title: "حجز جديد", body: "لديك جلسة مؤكدة جديدة.", link: "/coach/dashboard", is_demo: true },
  ]));

  console.log(JSON.stringify({ ok: true, accounts: { athlete: "athlete.seed@coachmatch.test", coach: "coach.seed@coachmatch.test" }, password: PASSWORD, seed_coaches: coachIds.length, seed_sports: seededSports.map((s) => s.name_ar), seed_availability: coachIds.length * SLOT_STARTS.length }));
}

await seed();
