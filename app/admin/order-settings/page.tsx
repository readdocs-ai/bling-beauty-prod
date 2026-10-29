import { revalidatePath } from "next/cache";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { getOrderingState } from "@/lib/order-switch";
import {liveReadiness} from '@/lib/worldpay/live-policy.mjs';
import {requireAdminSession} from '@/lib/admin-auth';

async function updateOrdering(formData: FormData) {
  "use server";
  await requireAdminSession();
  const suspend = formData.get("suspend") === "true";
  if(!suspend&&!liveReadiness(process.env).ready)throw Error('Complete the Live payment, signed-event and email settings before enabling new orders.');
  const { error } = await supabaseAdmin.from("store_settings")
    .update({ orders_suspended: suspend, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error("Could not update the ordering switch. No change was confirmed.");
  revalidatePath("/admin/order-settings");
  revalidatePath("/admin");
}

export default async function OrderSettingsPage() {
  const state = await getOrderingState();
  const ready=liveReadiness(process.env).ready;
  return <main className="mx-auto max-w-3xl px-4 py-12">
    <Link href="/admin" className="text-sm underline">Back to dashboard</Link>
    <h1 className="mt-5 text-3xl font-bold">New orders control</h1>
    <p className="mt-3">Dispatched within 1–2 working days, subject to product availability.</p>
    <section className="mt-6 rounded-2xl border bg-white p-6">
      <p className="text-lg font-semibold">{state.configured ? state.suspended ? "New orders suspended" : "New orders enabled" : "Not configured — orders blocked"}</p>
      {!state.configured && <p className="mt-2 text-sm text-red-700">Run supabase/order-switch.sql before using this control.</p>}
      <form action={updateOrdering} className="mt-5">
        <input type="hidden" name="suspend" value={state.suspended ? "false" : "true"}/>
        <button disabled={!state.configured||(state.suspended&&!ready)} className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50" type="submit">
          {state.suspended ? ready?"Enable new orders":"Complete Live payment setup" : "Suspend new orders"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-600">Existing orders remain accessible. Checkout must independently verify payment readiness before accepting orders.</p>
    </section>
  </main>;
}
