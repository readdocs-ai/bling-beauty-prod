import { NextResponse } from 'next/server';
import { previewReadiness } from '@/lib/worldpay/preview-readiness';

export const dynamic = 'force-dynamic';
export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not available' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json(previewReadiness(process.env), {
    status: 200, headers: { 'Cache-Control': 'no-store' },
  });
}
