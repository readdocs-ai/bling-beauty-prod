"use client";
import { useEffect, useRef, useState } from "react";
import { parseDeviceData } from "@/lib/worldpay/device-data.mjs";

/** Device collection does not prove authentication or authorisation.
 * A server-side coordinator must own the subsequent 3DS continuation.
 */
export default function WorldpayDeviceData({ deviceData }: { deviceData: unknown }) {
  const valid = parseDeviceData(deviceData);
  const form = useRef<HTMLFormElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (valid && !started && form.current) {
      setStarted(true);
      form.current.submit();
    }
  }, [valid?.url, valid?.jwt, started]);
  if (!valid) return <p role="alert">Bank security check is unavailable. Your order has not been paid.</p>;
  return <section aria-label="Card security check">
    <p className="text-sm">Checking your card security information. Payment has not yet been confirmed.</p>
    <form ref={form} action={valid.url} target="bling-worldpay-ddc-frame" method="POST">
      <input type="hidden" name="JWT" value={valid.jwt} />
      <button type="submit" className="rounded border px-3 py-2">Retry card security check</button>
    </form>
    <iframe name="bling-worldpay-ddc-frame" title="Card security device check" className="h-1 w-1 border-0" referrerPolicy="no-referrer" />
  </section>;
}
