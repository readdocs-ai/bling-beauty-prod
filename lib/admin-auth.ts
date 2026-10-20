import { cookies } from 'next/headers';
import { createAdminSession, ADMIN_SESSION_MAX_AGE } from '@/lib/admin-session';

const COOKIE = 'bbp_admin';

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, await createAdminSession(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}
