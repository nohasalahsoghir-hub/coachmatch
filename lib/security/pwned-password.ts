import { createHash } from "crypto";

type PwnedPasswordResult = {
  compromised: boolean;
  count: number;
};

export async function checkPwnedPassword(password: string): Promise<PwnedPasswordResult> {
  const hash = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "User-Agent": "CoachMatch-Password-Security/1.0",
        "Add-Padding": "true",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Pwned Passwords request failed with ${response.status}`);
    }

    const body = await response.text();
    const match = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.toUpperCase().startsWith(`${suffix}:`));

    if (!match) {
      return { compromised: false, count: 0 };
    }

    const count = Number(match.split(":")[1] ?? 0);
    return { compromised: Number.isFinite(count) && count > 0, count };
  } finally {
    clearTimeout(timeout);
  }
}
