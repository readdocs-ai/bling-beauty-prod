import { NextResponse } from 'next/server';
import { sendOrderEmail } from '@/lib/email/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Admin-only via middleware. Preview-only, fixed recipient, no order mutations. */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Email smoke test is restricted to Vercel Preview.' }, { status: 403 });
  }
  const origin = request.headers.get('origin');
  const expected = new URL(request.url).origin;
  if (!origin || origin !== expected) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  try {
    const result = await sendOrderEmail('admin-alert', {
      reference: `EMAIL-TEST-${Date.now()}`,
      customerName: 'Test customer (no real order)',
      customerEmail: 'info@blingbeautyproducts.com',
      totalGBP: 130,
      items: [{ name: 'Email transport test only — no payment', quantity: 1 }],
    });
    return NextResponse.json({ ok: true, message: 'Resend accepted the test email. Check the business inbox and Resend Logs.', providerMessageId: result.id }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Email smoke test failed', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ ok: false, error: 'Email test failed. Check server logs and Resend configuration.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
