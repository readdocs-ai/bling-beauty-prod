import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "bbp_admin";

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function setAdminCookie() {
  const secret = process.env.ADMIN_USERNAME + ":" + process.env.ADMIN_PASSWORD;
  cookies().set(COOKIE, hash(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminCookie() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}
