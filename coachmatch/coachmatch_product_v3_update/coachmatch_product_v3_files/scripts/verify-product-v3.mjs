import fs from "node:fs";
import path from "node:path";
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

const count = async (table, filter = {}) => {
  let q = db.from(table).select("id", { count: "exact", head: true });
  for (const [k, v] of Object.entries(filter)) q = q.eq(k, v);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
};

const coaches = await count("coaches", { is_demo: true });
const availability = await count("coach_availability", { is_demo: true });
const coachSports = await count("coach_sports", { is_demo: true });
const bookings = await count("bookings");
const seedBookings = await count("bookings", { is_demo: true });
const seedPayments = await count("payments", { is_demo: true });
const seedPackages = await count("athlete_packages", { is_demo: true });
const seedReviews = await count("reviews", { is_demo: true });
const seedPayouts = await count("payouts", { is_demo: true });
const seedNotifications = await count("notifications", { is_demo: true });
const seedDisputes = await count("disputes", { is_demo: true });
const legacyDemoRows = {};
for (const table of ["demo_athletes","demo_coaches","demo_coach_availability","demo_bookings","demo_payments","demo_packages","demo_reviews","demo_money_ledger","demo_notifications","demo_payouts","demo_disputes","demo_verification_requests"]) legacyDemoRows[table] = await count(table);
if (Object.values(legacyDemoRows).some((v) => v > 0)) throw new Error(`Legacy demo rows remain: ${JSON.stringify(legacyDemoRows)}`);
const seedCheckoutIntents = await count("booking_checkout_intents");

if (coaches < 120) throw new Error(`Expected at least 120 seeded coaches, found ${coaches}`);
if (availability < 840) throw new Error(`Expected at least 840 seeded availability rows, found ${availability}`);
if (coachSports < 120) throw new Error(`Expected at least 120 seeded coach-sport rows, found ${coachSports}`);
const { data: seedPackageRows, error: seedPackageError } = await db.from("athlete_packages").select("id,total_sessions,remaining_sessions,price_paid,subtotal,checkout_fee,platform_commission,session_unit_price,session_coach_net").eq("is_demo", true);
if (seedPackageError) throw seedPackageError;
if ((seedPackageRows || []).some(p => Number(p.remaining_sessions) < 0 || Number(p.remaining_sessions) > Number(p.total_sessions) || Number(p.session_unit_price || 0) <= 0 || Number(p.session_coach_net || 0) <= 0)) throw new Error("Seed package economics are invalid");
const publicCatalog = await count("coach_public_catalog");
const publicProfiles = await count("coach_public_profiles");
if (publicCatalog < coaches || publicProfiles < coaches) throw new Error(`Public coach projections are incomplete: catalog=${publicCatalog}, profiles=${publicProfiles}, coaches=${coaches}`);

const { data: publicReviewProbe, error: publicReviewProbeError } = await db.from("public_reviews").select("id,coach_id,rating,comment,created_at").limit(3);
if (publicReviewProbeError) throw publicReviewProbeError;
if ((publicReviewProbe || []).some((r) => Object.prototype.hasOwnProperty.call(r, "athlete_id") || Object.prototype.hasOwnProperty.call(r, "booking_id"))) throw new Error("Public review projection leaks private identifiers");


const { data: impossible, error: impossibleError } = await db
  .from("bookings")
  .select("id,status,payment_status,total_amount,package_id")
  .or("and(status.eq.confirmed,payment_status.neq.paid),and(status.eq.completed,payment_status.neq.paid),and(status.eq.confirmed,total_amount.lte.0,package_id.is.null),and(status.eq.completed,total_amount.lte.0,package_id.is.null),and(status.eq.confirmed,package_id.not.is.null,total_amount.neq.0),and(status.eq.completed,package_id.not.is.null,total_amount.neq.0)");
if (impossibleError) throw impossibleError;
if ((impossible || []).length) throw new Error(`Impossible booking states found: ${(impossible || []).map(x => x.id).join(",")}`);

const { data: packages, error: packageError } = await db.from("athlete_packages").select("id,total_sessions,remaining_sessions");
if (packageError) throw packageError;
const invalidPackages = (packages || []).filter(p => Number(p.remaining_sessions) < 0 || Number(p.remaining_sessions) > Number(p.total_sessions));
if (invalidPackages.length) throw new Error(`Invalid package balances found: ${invalidPackages.length}`);

const { data: badReviews, error: badReviewError } = await db
  .from("reviews")
  .select("id,booking_id,bookings!reviews_booking_id_fkey(status)");
if (badReviewError) throw badReviewError;
const reviewRows = badReviews || [];
const invalidReviews = reviewRows.filter(r => {
  const b = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
  return b && b.status !== "completed";
});
if (invalidReviews.length) throw new Error(`Reviews without completed bookings found: ${invalidReviews.length}`);

const { data: ledger, error: ledgerError } = await db
  .from("money_ledger")
  .select("reference,direction,amount")
  .eq("is_demo", true);
if (ledgerError) throw ledgerError;
const balances = new Map();
for (const row of ledger || []) {
  if (!row.reference) continue;
  const value = Number(row.amount || 0) * (row.direction === "credit" ? 1 : -1);
  balances.set(row.reference, (balances.get(row.reference) || 0) + value);
}
const unbalanced = [...balances.entries()].filter(([, v]) => Math.abs(v) > 0.01);
if (unbalanced.length) throw new Error(`Unbalanced seeded ledger references: ${unbalanced.map(([k,v]) => `${k}:${v}`).join(", ")}`);

for (const relative of ["app", "components", "lib"]) {
  const base = path.join(root, relative);
  const banned = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (/\.(tsx?|jsx?)$/.test(name)) {
        const text = fs.readFileSync(full, "utf8");
        if (/\/demo|DemoBookingForm|@\/lib\/demo|demo_coaches|demo_bookings|demo_payments|demo_packages|demo_reviews/.test(text)) banned.push(path.relative(root, full));
      }
    }
  };
  walk(base);
  if (banned.length) throw new Error(`Demo product references remain in source: ${banned.join(", ")}`);
}

console.log(JSON.stringify({
  ok: true,
  seed: { coaches, availability, coachSports, bookings: seedBookings, payments: seedPayments, packages: seedPackages, reviews: seedReviews, payouts: seedPayouts, notifications: seedNotifications, disputes: seedDisputes, checkoutIntents: seedCheckoutIntents },
  legacyDemoRows,
  totalBookings: bookings,
}));
