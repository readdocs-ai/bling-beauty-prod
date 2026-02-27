import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "bbp_admin";

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Next.js 16+ returns cookies() as a Promise, so we must await it.
 * NOTE: Setting cookies only works in Server Actions / Route Handlers.
 */
export async function setAdminCookie() {
  const secret = (process.env.ADMIN_USERNAME ?? "") + ":" + (process.env.ADMIN_PASSWORD ?? "");
  const store = await cookies();
  store.set(COOKIE, hash(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, "", { path: "/", maxAge: 0 });
}
