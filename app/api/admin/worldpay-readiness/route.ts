import { NextResponse } from 'next/server';
import { worldpayReadiness } from '@/lib/worldpay-readiness';

// This endpoint intentionally does not expose any credentials or configuration
// details to unauthenticated visitors. Use server-side deployment diagnostics.
export async function GET() {
  const status = worldpayReadiness();
  return NextResponse.json({
    provider: 'Worldpay',
    checkoutAvailable: status.liveCheckoutEnabled,
    message: 'Checkout is not yet activated. Worldpay verification is pending.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
