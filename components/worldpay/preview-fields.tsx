"use client";
import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type Sessions = { card?: unknown; cvv?: unknown };
type Checkout = {
  remove?: () => void;
  generateSessions?: (callback: (error: unknown, sessions?: Sessions) => void) => void;
};
type WPWindow = Window & { Worldpay?: { checkout?: { init: (
  config: unknown, callback: (error: unknown, checkout?: Checkout) => void
) => void } } };

/** Diagnostic only. Neither sessions nor raw card data are transmitted, stored, or logged. */
export default function WorldpayPreviewFields({ reference, checkoutId }: { reference: string; checkoutId: string }) {
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Waiting for secure Worldpay fields…");
  const instance = useRef<Checkout | null>(null);
  const busyRef = useRef(false);
  const mountedRef = useRef(true);

  const init = useCallback(() => {
    if (!loaded || !checkoutId || instance.current) return;
    const sdk = (window as WPWindow).Worldpay?.checkout;
    if (!sdk) { setStatus("Worldpay SDK unavailable."); return; }
    sdk.init({
      id: checkoutId,
      form: "#bling-preview-card-form",
      fields: {
        pan: { selector: "#bling-preview-pan", placeholder: "Card number" },
        expiry: { selector: "#bling-preview-expiry", placeholder: "MM/YY" },
        cvv: { selector: "#bling-preview-cvv", placeholder: "CVC" },
      },
      accessibility: { ariaLabel: { pan: "Card number", expiry: "Expiry", cvv: "Security code" } },
    }, (error, checkout) => {
      if (!mountedRef.current) { checkout?.remove?.(); return; }
      if (error || !checkout) { setStatus("Worldpay secure fields failed to load."); return; }
      instance.current = checkout;
      setReady(true);
      setStatus("Secure Worldpay fields loaded. Use Worldpay test-card details only.");
    });
  }, [loaded, checkoutId]);

  useEffect(() => {
    mountedRef.current = true;
    init();
    return () => {
      mountedRef.current = false;
      instance.current?.remove?.();
      instance.current = null;
    };
  }, [init]);

  function testSessions() {
    if (busyRef.current || !ready || !instance.current?.generateSessions) return;
    busyRef.current = true;
    setBusy(true);
    setStatus("Requesting disposable sessions from Worldpay Try…");
    try {
      instance.current.generateSessions((error, sessions) => {
        if (!mountedRef.current) return;
        busyRef.current = false;
        setBusy(false);
        // Do not inspect, print, send or persist the encrypted session payloads.
        // In particular they must NOT be passed to a payment endpoint in this diagnostic.
        if (error || !sessions?.card || !sessions?.cvv) {
          setStatus("Session generation failed. Check the test card fields and Worldpay configuration.");
          return;
        }
        setStatus("Worldpay Try confirmed card and CVC session generation. No payment was attempted. The disposable sessions were discarded.");
      });
    } catch {
      busyRef.current = false;
      setBusy(false);
      setStatus("Session generation could not complete.");
    }
  }

  return <section className="rounded-xl border border-amber-400 p-4">
    <Script src="https://try.access.worldpay.com/access-checkout/v2/checkout.js" strategy="afterInteractive"
      onLoad={() => setLoaded(true)} onError={() => setStatus("Worldpay SDK could not load.")} />
    <h3 className="font-semibold">Worldpay Access API — Preview diagnostics</h3>
    <p className="my-2 text-sm" role="status" aria-live="polite">{status}</p>
    <form id="bling-preview-card-form" onSubmit={event => { event.preventDefault(); testSessions(); }}>
      <label className="block text-sm">Card number<div id="bling-preview-pan" className="h-12 rounded border p-2" /></label>
      <label className="mt-3 block text-sm">Expiry<div id="bling-preview-expiry" className="h-12 rounded border p-2" /></label>
      <label className="mt-3 block text-sm">CVC<div id="bling-preview-cvv" className="h-12 rounded border p-2" /></label>
      <button className="mt-4 rounded border px-4 py-2 disabled:opacity-50" type="submit" disabled={!ready || busy}>
        {busy ? "Checking sessions…" : "Test secure sessions (no charge)"}
      </button>
    </form>
    <p className="mt-3 text-sm text-amber-900">Preview only, pending order {reference.slice(0, 14)}… Use test cards only. No authorisation, 3D Secure or settlement takes place here. Do not enter a real card.</p>
  </section>;
}
