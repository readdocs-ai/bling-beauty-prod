import 'server-only';
import {cookies} from 'next/headers';
import {verifyAdminSession} from '@/lib/admin-session';
export async function shippingAdminAllowed(request:Request){
 return request.headers.get('origin')===new URL(request.url).origin&&
  await verifyAdminSession((await cookies()).get('bbp_admin')?.value??'');
}
