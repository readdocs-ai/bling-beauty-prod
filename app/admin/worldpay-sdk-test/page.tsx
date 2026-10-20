import { notFound } from "next/navigation";
import SdkFields from "./sdk-fields";

export const dynamic = "force-dynamic";

export default function WorldpaySdkTestPage() {
  // Admin middleware also requires an authenticated admin session.
  if (process.env.VERCEL_ENV !== "preview" || process.env.WORLDPAY_ENVIRONMENT === "live") notFound();
  const checkoutId = process.env.WORLDPAY_CHECKOUT_ID?.trim() || "d94c8eb8-948e-43d1-8907-a64f49602c6e";
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="font-display text-3xl">Worldpay Access Checkout — SDK test</h1>
      <p className="mt-4 text-sm">Preview only. This page checks whether Worldpay can load its secure card fields. It can generate a one-time Worldpay Try card session and securely hand it to a Preview-only BLING endpoint, but cannot authorise or capture payments. Use test cards only.</p>
      <SdkFields checkoutId={checkoutId} />
      <p className="mt-5 text-xs">Existing HPP checkout is unchanged. Production ordering remains controlled by the existing database switch.</p>
    </main>
  );
}
