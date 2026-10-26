"use client";
import Script from "next/script";
import WorldpayDeviceData from "./device-data";
import IssuerChallenge from "./issuer-challenge";
import { useCallback, useEffect, useRef, useState } from "react";

type Sessions = { card?: unknown; cvv?: unknown };
type Checkout = {
  remove?: () => void;
  generateSessions?: (callback: (error: unknown, sessions?: Sessions) => void) => void;
};
type WPWindow = Window & { Worldpay?: { checkout?: { init: (
  config: unknown, callback: (error: unknown, checkout?: Checkout) => void
) => void } } };

/** Preview-only, one-shot Try payment initiation; card session sent only to our guarded server endpoint. */
export default function WorldpayPreviewFields({ reference, checkoutId, ownershipSecret }: { reference: string; checkoutId: string; ownershipSecret: string }) {
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deviceData, setDeviceData] = useState<unknown>(null);
  const [challenge, setChallenge] = useState<unknown>(null);
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
    setStatus("Requesting a disposable card session from Worldpay Try…");
    try {
      instance.current.generateSessions(async (error, sessions) => {
        if (!mountedRef.current) return;
        if (error || typeof sessions?.card !== "string" || !sessions.card) {
          busyRef.current = false;
          setBusy(false);
          setStatus("Session generation failed. No payment has been attempted.");
          return;
        }
        // Treat the session as a one-time credential. Never log or persist it.
        // No auto-retry, even after a network error: Worldpay might have processed the request.
        try {
          const response = await fetch("/api/worldpay/preview-initiate", {
            method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference, ownershipSecret, sessionHref: sessions.card,
              browser: { userAgent: navigator.userAgent, language: navigator.language,
                width: window.screen.width, height: window.screen.height,
                timeZone: new Date().getTimezoneOffset() } }),
          });
          const result: { message?: string; error?: string; providerStage?: string; deviceData?: unknown } = await response.json().catch(() => ({}));
          if (mountedRef.current && response.ok && result.providerStage === 'device_data' && result.deviceData)
            setDeviceData(result.deviceData);
          if (mountedRef.current) setStatus(response.ok
            ? (result.message || "Worldpay has received the test attempt. Verify its status before proceeding.")
            : (response.status === 503 && result.error === "Preview payment initiation is disabled"
              ? "Worldpay Try initiation is disabled. No payment request was sent."
              : "Payment outcome is not confirmed. Do not try again; check the attempt status."));
        } catch {
          if (mountedRef.current) setStatus("Unable to confirm Worldpay's response. Do not retry this payment.");
        } finally {
          busyRef.current = false;
          if (mountedRef.current) setBusy(false);
        }
      });
    } catch {
      busyRef.current = false;
      setBusy(false);
      setStatus("Session generation could not complete.");
    }
  }

  async function continueDevice(collectionReference: string) {
    const response = await fetch('/api/worldpay/preview-device-data', {
      method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
      body: JSON.stringify({reference,ownershipSecret,collectionReference}),
    });
    const result: {providerStage?:string; challenge?:unknown} = await response.json().catch(()=>({}));
    setDeviceData(null);
    if (response.ok && result.providerStage === 'challenge' && result.challenge) setChallenge(result.challenge);
    setStatus(response.ok ? 'Worldpay authentication progressed. Payment is not confirmed.' :
      'Authentication status is unresolved. Do not retry payment.');
  }
  async function continueChallenge() {
    const response = await fetch('/api/worldpay/preview-challenge-complete', {
      method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
      body:JSON.stringify({reference,ownershipSecret}),
    });
    setChallenge(null);
    setStatus(response.ok ? 'Bank authentication submitted for verification. Payment is not confirmed.' :
      'Bank verification unresolved. Do not retry payment.');
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
        {busy ? "Checking sessions…" : "Submit Worldpay Try test payment"}
      </button>
    </form>
    {deviceData ? <WorldpayDeviceData deviceData={deviceData} onComplete={collectionReference => void continueDevice(collectionReference)} /> : null}
    {challenge ? <IssuerChallenge challenge={challenge} onReturn={() => void continueChallenge()} /> : null}
    <p className="mt-3 text-sm text-amber-900">Preview only, pending order {reference.slice(0, 14)}… TEST CARDS ONLY. This action can initiate a Worldpay Try payment when enabled by the server. It does not confirm an order as paid. Do not enter a real card or submit twice.</p>
  </section>;
}
