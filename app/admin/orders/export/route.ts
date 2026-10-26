import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {mergeAdminOrders} from "@/lib/admin-orders.mjs";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const raw = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  const protectedValue = /^[\s]*[=+@\-\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + protectedValue.replace(/"/g, '""') + '"';
}

export async function GET() {
  const [legacy,worldpay]=await Promise.all([
    supabaseAdmin.from('orders').select('*').order('created_at',{ascending:false}).limit(500),
    supabaseAdmin.from('bling_paid_orders').select('*').eq('status','paid').order('created_at',{ascending:false}).limit(500),
  ]);
  if (legacy.error||worldpay.error) return NextResponse.json({ error: "Unable to export orders" }, { status: 503 });
  const rows = mergeAdminOrders(legacy.data??[],worldpay.data??[]);
  const columns = ["payment_environment","test_order","payment_provider","payment_verified_at","id", "order_number", "created_at", "customer_name", "name", "customer_email", "email", "customer_phone", "phone", "shipping_name", "shipping_address", "shipping_address_line1", "shipping_address_line2", "shipping_city", "shipping_postcode", "shipping_country", "total_gbp", "total_amount_gbp", "payment_status", "fulfilment_status", "status"];
  const csv = "\uFEFF" + [columns.map(csvCell).join(","), ...rows.map(row => columns.map(column => csvCell(row[column])).join(","))].join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="bling-orders-latest-500.csv"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
