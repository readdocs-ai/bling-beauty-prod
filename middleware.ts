import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "bbp_admin";

async function hash(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  if (!url.pathname.startsWith("/admin")) return NextResponse.next();
  if (url.pathname === "/admin/login") return NextResponse.next();

  const cookie = req.cookies.get(COOKIE)?.value ?? "";
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const ok = Boolean(username && password && cookie && cookie === await hash(username + ":" + password));

  if (!ok) return NextResponse.redirect(new URL("/admin/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
