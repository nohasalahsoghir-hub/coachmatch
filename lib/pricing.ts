// Business constants — keep in one place so pricing logic never drifts.
export const PLATFORM_COMMISSION_RATE = 0.15; // 15% taken from the coach's price
export const ATHLETE_CHECKOUT_FEE = 10; // flat 10 EGP operational fee per checkout
export const PACKAGE_VALID_DAYS = 90;

export function calculateSingleSession(sessionRate: number) {
  const coachNet = round2(sessionRate * (1 - PLATFORM_COMMISSION_RATE));
  return {
    totalPrice: sessionRate,
    platformFee: ATHLETE_CHECKOUT_FEE,
    coachNet,
    athletePays: round2(sessionRate + ATHLETE_CHECKOUT_FEE),
  };
}

export function calculatePackagePurchase(packageRate: number, sessions = 8) {
  const coachNet = round2(packageRate * (1 - PLATFORM_COMMISSION_RATE));
  return {
    totalPrice: packageRate,
    platformFee: ATHLETE_CHECKOUT_FEE,
    coachNet,
    athletePays: round2(packageRate + ATHLETE_CHECKOUT_FEE),
    perSessionValue: round2(packageRate / sessions),
  };
}

// A session drawn from an already-paid package: no new checkout fee,
// the coach's share of that per-session value was already commissioned
// at purchase time, so we just re-derive it for record-keeping.
export function calculatePackageSession(perSessionValue: number) {
  const coachNet = round2(perSessionValue * (1 - PLATFORM_COMMISSION_RATE));
  return { totalPrice: perSessionValue, platformFee: 0, coachNet };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
