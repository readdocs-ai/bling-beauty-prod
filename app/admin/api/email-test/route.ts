import { NextResponse } from 'next/server';
import { sendOrderEmail } from '@/lib/email/send';
import {cookies} from 'next/headers';
import {verifyAdminSession} from '@/lib/admin-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Signed admin session, same-origin POST, fixed recipient, no order or payment mutations. */
export async function POST(request: Request) {
  if(!await verifyAdminSession((await cookies()).get('bbp_admin')?.value??''))return NextResponse.json({error:'Unauthorised'},{status:401});
  const environment=process.env.WORLDPAY_ENVIRONMENT;
  if (!((process.env.VERCEL_ENV==='preview'&&environment==='try')||
        (process.env.VERCEL_ENV==='production'&&environment==='live'))) {
    return NextResponse.json({ error: 'Email test environment is not configured.' }, { status: 403 });
  }
  const origin = request.headers.get('origin');
  const expected = new URL(request.url).origin;
  if (!origin || origin !== expected) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  try {
    const result = await sendOrderEmail('transport-test', {
      reference: 'EMAIL-TRANSPORT-TEST',
      customerName: 'Test customer (no real order)',
      customerEmail: 'info@blingbeautyproducts.com',
      totalGBP: 130,
      items: [{ name: 'Email transport test only — no payment', quantity: 1 }],
    },{environment,idempotencyKey:`bling/${environment}/email-smoke/${Math.floor(Date.now()/3600000)}`});
    return NextResponse.json({ ok: true, message: 'Resend accepted the test email. Check the business inbox and Resend Logs.', providerMessageId: result.id }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Email smoke test failed', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ ok: false, error: 'Email test failed. Check server logs and Resend configuration.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
