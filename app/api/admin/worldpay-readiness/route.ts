import { NextResponse } from 'next/server';
import { worldpayReadiness } from '@/lib/worldpay-readiness';

// This endpoint intentionally does not expose any credentials or configuration
// details to unauthenticated visitors. Use server-side deployment diagnostics.
export async function GET() {
  const status = worldpayReadiness();
  return NextResponse.json({
    provider: 'Worldpay',
    checkoutAvailable: status.liveCheckoutEnabled,
    message: status.liveCheckoutEnabled?'Payment configuration present.':'Card payments are not yet available.',
  }, { headers: { 'Cache-Control': 'no-store' } });
}
