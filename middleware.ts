import { NextResponse, type NextRequest } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-session';

const COOKIE = 'bbp_admin';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith('/admin')) return NextResponse.next();
  if (path === '/admin/login') return NextResponse.next();

  const cookie = req.cookies.get(COOKIE)?.value ?? '';
  if (!(await verifyAdminSession(cookie))) {
    // API callers must receive a proper error rather than a redirected HTML login page.
    if (path.startsWith('/admin/api/')) {
      return NextResponse.json({ error: 'Administrator authentication required' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
