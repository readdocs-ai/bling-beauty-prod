import {tryDeliveryCheck} from '@/lib/worldpay/try-delivery-check.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=10;
function handle(request:Request){
  return tryDeliveryCheck(request,{
    environment:process.env.VERCEL_ENV,
    worldpayEnvironment:process.env.WORLDPAY_ENVIRONMENT,
    enabled:process.env.BLING_PREVIEW_WEBHOOK_DELIVERY_CHECK,
  },metadata=>console.info('Worldpay Try delivery diagnostic',metadata));
}
export const GET=handle;
export const POST=handle;
