import { supabaseAdmin } from "@/lib/supabase";

// Fail closed if the control table cannot be read.
export async function getOrderingState() {
  const { data, error } = await supabaseAdmin.from("store_settings")
    .select("orders_suspended").eq("id", 1).single();
  if (error || !data) return { suspended: true, configured: false };
  return { suspended: Boolean(data.orders_suspended), configured: true };
}
