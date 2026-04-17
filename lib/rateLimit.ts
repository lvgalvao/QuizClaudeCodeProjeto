import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const MAX_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;

function isTrustedProxyEnv(): boolean {
  return Boolean(process.env.VERCEL) || process.env.TRUST_PROXY_HEADERS === "1";
}

export function getClientIp(req: NextRequest): string {
  if (isTrustedProxyEnv()) {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) {
      const first = fwd.split(",")[0]?.trim();
      if (first) return first;
    }
    const real = req.headers.get("x-real-ip");
    if (real) return real;
  }
  return "unknown";
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("IP_HASH_SALT is required in production.");
    }
    console.warn(
      "IP_HASH_SALT missing — using insecure dev fallback. Set IP_HASH_SALT before deploying."
    );
  }
  return createHash("sha256")
    .update(`${salt ?? "dev-only-insecure-salt"}:${ip}`)
    .digest("hex");
}

// Note: this is a soft limit. A check-then-insert is not atomic, so two
// concurrent submissions from the same IP can both pass the check and both
// insert. Acceptable for a "≈ 10/h" cap; tighten with a SQL function if needed.
export async function checkRateLimit(ipHash: string): Promise<{ ok: boolean; count: number }> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const supabase = getServiceClient();
  const { count, error } = await supabase
    .from("rankings")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) {
    return { ok: true, count: 0 };
  }
  const c = count ?? 0;
  return { ok: c < MAX_PER_HOUR, count: c };
}
