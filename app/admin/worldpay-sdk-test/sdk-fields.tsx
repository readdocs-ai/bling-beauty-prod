"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type SafeDiagnostics = { callback: "success" | "error" | "empty"; errorType: string; errorCode: string; sessionType: string; sessionKeys: string[]; hasSessionState: boolean };
const safeErrorCode = (value: unknown): string => {
  if (!value || typeof value !== "object") return "none";
  const raw = (value as Record<string, unknown>).code;
  return typeof raw === "string" && /^[A-Z0-9_-]{1,60}$/i.test(raw) ? raw : "not-provided";
};
const inspectCallback = (error: unknown, session: unknown): SafeDiagnostics => {
  const isObject = !!session && typeof session === "object" && !Array.isArray(session);
  const keys = isObject ? Object.keys(session as Record<string, unknown>) : [];
  return {
    callback: error ? "error" : session ? "success" : "empty",
    errorType: error === null ? "null" : typeof error,
    errorCode: safeErrorCode(error),
    sessionType: session === null ? "null" : Array.isArray(session) ? "array" : typeof session,
    sessionKeys: keys.filter(k => /^(sessionState|session|card|token|type)$/i.test(k)),
    hasSessionState: isObject && typeof (session as Record<string, unknown>).sessionState === "string",
  };
};
type CheckoutInstance = { remove?: () => void; generateSessionState?: (callback: (error: unknown, session?: unknown) => void) => void };
type WorldpayWindow = Window & { Worldpay?: { checkout?: { init: (settings: unknown, callback: (error: unknown, instance?: CheckoutInstance) => void) => void } } };

export default function SdkFields({ checkoutId }: { checkoutId: string }) {
  const [status, setStatus] = useState("Waiting for Worldpay SDK…");
  const [scriptReady, setScriptReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState("");
  const [tryAuth, setTryAuth] = useState(false);
  const [authorisationStatus, setAuthorisationStatus] = useState("");
  const [diagnostics, setDiagnostics] = useState<SafeDiagnostics | null>(null);
  const instance = useRef<CheckoutInstance | null>(null);
  const initialized = useRef(false);
  const initialise = useCallback(() => {
    if (initialized.current) return;
    const sdk = (window as WorldpayWindow).Worldpay?.checkout;
    if (!sdk) { setStatus("Worldpay SDK was not available."); return; }
    initialized.current = true;
    sdk.init({
      id: checkoutId,
      form: "#bling-worldpay-sdk-form",
      fields: {
        pan: { selector: "#bling-card-pan", placeholder: "Card number" },
        expiry: { selector: "#bling-card-expiry", placeholder: "MM/YY" },
        cvv: { selector: "#bling-card-cvv", placeholder: "CVC" },
      },
      accessibility: { ariaLabel: { pan: "Card number", expiry: "Expiry date", cvv: "Security code" } },
    }, (error, checkout) => {
      if (error || !checkout) { setStatus("SDK field initialisation failed. Check the browser console for Worldpay errors."); return; }
      instance.current = checkout;
      setStatus("Worldpay secure card fields loaded successfully. No payment has been attempted.");
    });
  }, [checkoutId]);
  const generateTestSession = useCallback(() => {
    setHandoffStatus("");
    setAuthorisationStatus("");
    if (!instance.current?.generateSessionState || generating) return;
    setGenerating(true);
    setSessionReady(false);
    setDiagnostics(null);
    setStatus("Requesting a Worldpay Try card session…");
    instance.current.generateSessionState(async (error, session) => {
      setGenerating(false);
      // Never display, log, transmit or persist the one-time card-session token.
      setDiagnostics(inspectCallback(error, session));
      if (error || !session) {
        setStatus("Card-session generation failed. Check the test card details and try again.");
        return;
      }
      setSessionReady(true);
      setStatus("Worldpay Try card session generated successfully. No payment was submitted or authorised.");
      // Single-use session is sent immediately, never saved or printed.
      const token = typeof session === "string" ? session : session && typeof session === "object" && "sessionState" in session && typeof session.sessionState === "string" ? session.sessionState : null;
      if (!token) { setHandoffStatus("SDK returned a success result but not a recognised session string."); return; }
      try {
        const response = await fetch(tryAuth ? "/admin/api/worldpay-try-authorise" : "/admin/api/worldpay-session-check", {
          method: "POST", credentials: "same-origin", cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tryAuth ? { sessionState: token, confirmation: "AUTHORISE_TRY_100P" } : { sessionState: token }),
        });
        const result = await response.json();
        if (tryAuth) {
          const status = result.authorized ? "TRY AUTHORISED (not captured)" : "TRY not authorised / unconfirmed";
          setAuthorisationStatus(`${status}; HTTP ${result.httpStatus ?? response.status}; reference ${result.reference ?? "unavailable"}. No order created. Never retry this card session.`);
        } else {
          setHandoffStatus(response.ok && result.accepted
            ? "Secure session reached BLING server successfully. No payment was authorised."
            : `Server handoff failed (HTTP ${response.status}).`);
        }
      } catch { setHandoffStatus("Request outcome uncertain. Do not reuse the card session."); }
    });
  }, [generating, tryAuth]);
  useEffect(() => {
    if (scriptReady) initialise();
    return () => { instance.current?.remove?.(); instance.current = null; };
  }, [scriptReady, initialise]);
  return (
    <section className="mt-8 rounded-2xl border border-soft-black/10 bg-white p-6 shadow-soft">
      <Script src="https://try.access.worldpay.com/access-checkout/v2/checkout.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} onError={() => setStatus("Unable to load Worldpay SDK script.")} />
      <p role="status" className="mb-5 text-sm">{status}</p>
      <form id="bling-worldpay-sdk-form" onSubmit={e => e.preventDefault()}>
        <label className="block text-sm font-semibold" htmlFor="bling-card-pan">Card number</label>
        <div id="bling-card-pan" className="mt-2 h-12 rounded-lg border border-gray-300 px-3 py-2" />
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-semibold" htmlFor="bling-card-expiry">Expiry</label><div id="bling-card-expiry" className="mt-2 h-12 rounded-lg border border-gray-300 px-3 py-2" /></div>
          <div><label className="block text-sm font-semibold" htmlFor="bling-card-cvv">CVC</label><div id="bling-card-cvv" className="mt-2 h-12 rounded-lg border border-gray-300 px-3 py-2" /></div>
        </div>
        <p className="mt-6 text-sm text-amber-800">Preview / Worldpay Try only. Use test cards only. Authorisation does not capture money, create orders or perform 3D Secure.</p>
        <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={tryAuth} disabled={generating} onChange={e => setTryAuth(e.target.checked)} /> I explicitly approve a single Worldpay Try £1.00 authorisation attempt (no capture). This uses a new, single-use card session.</label>
        <button type="button" onClick={generateTestSession} disabled={generating || !instance.current} className="mt-4 rounded-lg bg-amber-600 px-5 py-3 text-white disabled:opacity-50">{generating ? "Submitting…" : tryAuth ? "Generate session and attempt £1.00 Try authorisation" : "Generate test card session (no payment)"}</button>
        {diagnostics && <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs" role="status">
          <p className="font-semibold">Safe SDK callback diagnostics (no card data or tokens)</p>
          <p>Callback: {diagnostics.callback}</p>
          <p>Error type: {diagnostics.errorType}; code: {diagnostics.errorCode}</p>
          <p>Session result type: {diagnostics.sessionType}</p>
          <p>Recognised result keys: {diagnostics.sessionKeys.join(", ") || "none"}</p>
          <p>Session-state property present: {diagnostics.hasSessionState ? "yes" : "no"}</p>
        </div>}
        {sessionReady && <p className="mt-3 text-sm text-green-800">Session generation passed.</p>}
        {handoffStatus && <p role="status" className="mt-3 text-sm font-medium">{handoffStatus}</p>}
        {authorisationStatus && <p role="status" className="mt-3 text-sm font-medium">{authorisationStatus}</p>}
      </form>
    </section>
  );
}
