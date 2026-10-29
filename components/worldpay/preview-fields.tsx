"use client";
import Script from "next/script";
import WorldpayDeviceData from "./device-data";
import IssuerChallenge from "./issuer-challenge";
import { useCallback, useEffect, useRef, useState } from "react";
import { markBrowserAttemptSubmitted, readBrowserAttempt } from "@/lib/worldpay/browser-attempt.mjs";

type Checkout = {
  remove?: () => void;
  generateSessionState?: (callback: (error: unknown, sessionState?: string) => void) => void;
};
type WPWindow = Window & { Worldpay?: { checkout?: { init: (
  config: unknown, callback: (error: unknown, checkout?: Checkout) => void
) => void } } };

/** Preview-only, one-shot Try payment initiation; card session sent only to our guarded server endpoint. */
export default function WorldpayPreviewFields({ reference, checkoutId, ownershipSecret, environment='try',amountPence }: { reference: string; checkoutId: string; ownershipSecret: string;environment?:'try'|'live';amountPence?:number }) {
  const isLive=environment==='live';
  const endpoint=(step:string)=>`/api/worldpay/${isLive?'':'preview-'}${step}`;
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [deviceData, setDeviceData] = useState<unknown>(null);
  const [challenge, setChallenge] = useState<unknown>(null);
  const [status, setStatus] = useState("Waiting for secure Worldpay fields…");
  const instance = useRef<Checkout | null>(null);
  const busyRef = useRef(false);
  const submittedRef = useRef(false);
  const deviceContinuationStarted = useRef(false);
  const challengeContinuationStarted = useRef(false);
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
      setStatus(isLive?"Secure Worldpay fields loaded.":"Secure Worldpay fields loaded. Use Worldpay test-card details only.");
    });
  }, [loaded, checkoutId, isLive]);

  useEffect(() => {
    mountedRef.current = true;
    try {
      const restored = readBrowserAttempt(window.sessionStorage,environment);
      if (restored?.reference !== reference || restored.submitted) {
        submittedRef.current = true;
        setSubmitted(true);
        setStatus('Previous payment attempt restored. Check its status; do not submit another payment.');
        return;
      }
    } catch {
      submittedRef.current = true;
      setSubmitted(true);
      setStatus('Unable to restore payment status. Do not submit another payment.');
      return;
    }
    init();
    return () => {
      mountedRef.current = false;
      instance.current?.remove?.();
      instance.current = null;
    };
  }, [init, reference,environment]);

  function testSessions() {
    if (busyRef.current || submittedRef.current || !ready || !instance.current?.generateSessionState) return;
    busyRef.current = true;
    setBusy(true);
    setStatus(isLive?"Preparing your secure payment…":"Requesting a disposable card session from Worldpay Try…");
    try {
      instance.current.generateSessionState(async (error, sessionState) => {
        if (!mountedRef.current) return;
        if (error || typeof sessionState !== "string" || !sessionState) {
          busyRef.current = false;
          setBusy(false);
          setStatus("Session generation failed. No payment has been attempted.");
          return;
        }
        // Treat the session as a one-time credential. Never log or persist it.
        // No auto-retry, even after a network error: Worldpay might have processed the request.
        if (submittedRef.current) return;
        try { markBrowserAttemptSubmitted(window.sessionStorage, reference,environment); }
        catch {
          busyRef.current = false;
          setBusy(false);
          setStatus('Payment recovery is unavailable. No payment has been attempted. Contact support.');
          return;
        }
        submittedRef.current = true;
        setSubmitted(true);
        try {
          const response = await fetch(endpoint('initiate'), {
            method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference, ownershipSecret, sessionHref: sessionState,
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
    if (deviceContinuationStarted.current) return;
    deviceContinuationStarted.current = true;
    try {
    const response = await fetch(endpoint('device-data'), {
      method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
      body: JSON.stringify({reference,ownershipSecret,collectionReference}),
    });
    const result: {providerStage?:string; challenge?:unknown} = await response.json().catch(()=>({}));
      if (!mountedRef.current) return;
      setDeviceData(null);
      if (response.ok && result.providerStage === 'challenge' && result.challenge) setChallenge(result.challenge);
      setStatus(response.ok ? 'Worldpay authentication progressed. Payment is not confirmed.' :
        'Authentication status is unresolved. Do not retry payment.');
    } catch {
      if (mountedRef.current) setStatus('Authentication status is unresolved. Do not retry payment.');
    }
  }
  async function continueChallenge() {
    if (challengeContinuationStarted.current) return;
    challengeContinuationStarted.current = true;
    try {
    const response = await fetch(endpoint('challenge-complete'), {
      method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
      body:JSON.stringify({reference,ownershipSecret}),
    });
      if (!mountedRef.current) return;
      setChallenge(null);
      setStatus(response.ok ? 'Bank authentication submitted for verification. Payment is not confirmed.' :
        'Bank verification unresolved. Do not retry payment.');
    } catch {
      if (mountedRef.current) setStatus('Bank verification unresolved. Do not retry payment.');
    }
  }
  return <section className="rounded-xl border border-amber-400 p-4">
    <Script src={isLive?"https://access.worldpay.com/access-checkout/v2/checkout.js":"https://try.access.worldpay.com/access-checkout/v2/checkout.js"} strategy="afterInteractive"
      onReady={() => setLoaded(true)} onError={() => setStatus("Worldpay SDK could not load.")} />
    <h3 className="font-semibold">{isLive?'Secure card payment':'Worldpay Access API — Preview diagnostics'}</h3>
    <p className="my-2 text-sm" role="status" aria-live="polite">{status}</p>
    <form id="bling-preview-card-form" onSubmit={event => { event.preventDefault(); testSessions(); }}>
      <label className="block text-sm">Card number<div id="bling-preview-pan" className="h-12 rounded border p-2" /></label>
      <label className="mt-3 block text-sm">Expiry<div id="bling-preview-expiry" className="h-12 rounded border p-2" /></label>
      <label className="mt-3 block text-sm">CVC<div id="bling-preview-cvv" className="h-12 rounded border p-2" /></label>
      <button className="mt-4 rounded border px-4 py-2 disabled:opacity-50" type="submit" disabled={!ready || busy || submitted}>
        {busy ? (isLive?'Submitting payment…':'Submitting test payment…') : submitted ? 'Payment submitted — check status' : isLive ? `Pay${amountPence?` ${new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(amountPence/100)}`:''} securely` : 'Submit Worldpay Try test payment'}
      </button>
    </form>
    {deviceData ? <WorldpayDeviceData deviceData={deviceData} onComplete={collectionReference => void continueDevice(collectionReference)} /> : null}
    {challenge ? <IssuerChallenge challenge={challenge} onReturn={() => void continueChallenge()} /> : null}
    <p className="mt-3 break-words text-sm text-amber-900">{isLive?`Order ${reference}. Your bank may ask you to approve this payment. Please submit once and wait for confirmation.`:`Preview only, pending order ${reference}. TEST CARDS ONLY. Do not enter a real card or submit twice.`}</p>
  </section>;
}
