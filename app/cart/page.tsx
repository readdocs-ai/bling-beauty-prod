"use client";

import Image from "next/image";
import { CollectionImage } from "@/components/luxury/collection-image";
import WorldpayPreviewFields from "@/components/worldpay/preview-fields";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readBrowserAttempt, saveBrowserAttempt, clearPaidBrowserAttempt, markBrowserAttemptSubmitted } from "@/lib/worldpay/browser-attempt.mjs";

function formatGBP(n: number) {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

export default function CartPage() {
  const { items, subtotal, remove, setQty, clear } = useCart();
  const [configuration,setConfiguration]=useState<{environment:'try'|'live';available:boolean}|null>(null);
  const [paymentAmount,setPaymentAmount]=useState<number>();
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [shipping, setShipping] = useState({ address1: "", address2: "", city: "", postcode: "", country: "GB" as const });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewReference, setPreviewReference] = useState("");
  const [previewOwnershipSecret, setPreviewOwnershipSecret] = useState("");
  const [previewCheckoutId, setPreviewCheckoutId] = useState("");
  const [previewStatus, setPreviewStatus] = useState("");
  const [reconciling, setReconciling] = useState(false);
  const [reconciliationResult, setReconciliationResult] = useState("");
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [captureAvailable, setCaptureAvailable] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureSubmitted, setCaptureSubmitted] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('');
  useEffect(() => {
    let active=true;
    (async()=>{
      try{
        const response=await fetch('/api/checkout/config',{cache:'no-store'});
        const config=await response.json();
        if(!response.ok||!['try','live'].includes(config.environment)||typeof config.available!=='boolean')throw Error();
        if(!active)return;setConfiguration(config);
        const attempt=readBrowserAttempt(window.sessionStorage,config.environment);
        if(attempt){
          const statusResponse=await fetch(`/api/worldpay/${config.environment==='try'?'preview-':''}attempt-status`,{
            method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
            body:JSON.stringify({reference:attempt.reference,ownershipSecret:attempt.ownershipSecret})});
          const status=await statusResponse.json();if(!statusResponse.ok)throw Error();
          if(status.status==='paid_verified'){
            clearPaidBrowserAttempt(window.sessionStorage,attempt.reference,config.environment);clear();
            window.location.assign(`/success?reference=${encodeURIComponent(attempt.reference)}`);return;
          }
          if(status.status!=='pending'&&!attempt.submitted)markBrowserAttemptSubmitted(window.sessionStorage,attempt.reference,config.environment);
          if(!active)return;
          setPreviewOwnershipSecret(attempt.ownershipSecret);setPreviewCheckoutId(attempt.checkoutId);
          setPaymentAmount(status.amountPence);setPreviewReference(attempt.reference);
          setPreviewStatus(status.status==='pending'?'Prepared checkout restored.':'Previous payment attempt restored. Check its status before continuing.');
        }
        setRecoveryReady(true);
      }catch{if(active)setError('Checkout is unavailable. If you already submitted a payment, please contact us before trying again.');}
    })();return()=>{active=false;};
  }, []);
  // A browser may restore this page from its back/forward cache after payment.
  // The old pending state must not leave checkout permanently disabled.
  useEffect(() => {
    const restore = () => setBusy(false);
    window.addEventListener("pageshow", restore);
    window.addEventListener("focus", restore);
    return () => {
      window.removeEventListener("pageshow", restore);
      window.removeEventListener("focus", restore);
    };
  }, []);
  async function checkout() {
    // An already-prepared checkout must never create a second pending attempt.
    if (!recoveryReady || !configuration?.available || busy || previewReference) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(configuration.environment==='live'?"/api/checkout":"/api/worldpay/preview-prepare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map(i => ({ slug: i.slug, quantity: i.qty })), customer, shipping }) });
      const result = await response.json();
      if (!response.ok || !result.reference) throw new Error(result.error || "Unable to start checkout");
      if (typeof result.ownershipSecret !== "string" || !/^[a-f0-9]{64}$/.test(result.ownershipSecret)) throw new Error("Checkout verification unavailable");
      if (typeof result.checkoutId !== "string" || !result.checkoutId) throw new Error("Worldpay secure fields are not configured");
      saveBrowserAttempt(window.sessionStorage,{version:1,reference:result.reference,
        ownershipSecret:result.ownershipSecret,checkoutId:result.checkoutId,submitted:false},configuration.environment);
      // Set the reference last, only after all data needed to render the fields is validated.
      setPaymentAmount(result.amountPence);
      setPreviewOwnershipSecret(result.ownershipSecret);
      setPreviewCheckoutId(result.checkoutId);
      setPreviewReference(result.reference);
      setPreviewStatus("Pending — no payment has been attempted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout unavailable");
    } finally {
      setBusy(false);
    }
  }


  async function checkPreviewStatus() {
    if (!previewReference || !previewOwnershipSecret) return;
    try {
      const response = await fetch(configuration?.environment==='live'?'/api/worldpay/attempt-status':'/api/worldpay/preview-attempt-status', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({reference:previewReference,ownershipSecret:previewOwnershipSecret}), cache:'no-store'
      });
      const result = await response.json();
      if (!response.ok) throw new Error('Status unavailable');
      if(result.status==='paid_verified'){
        clearPaidBrowserAttempt(window.sessionStorage,previewReference,configuration?.environment);clear();
        window.location.assign(`/success?reference=${encodeURIComponent(previewReference)}`);return;
      }
      if(configuration?.environment==='live')setPreviewStatus(result.providerStage==='declined'?'Your payment was declined. Please contact us before starting another payment.':'We are checking your payment. Please wait for confirmation before trying again.');
      else setPreviewStatus(`Order: ${result.status}. Worldpay: ${result.providerStage || 'not started'}.`);
      setCaptureAvailable(configuration?.environment==='try' && result.settlementMode !== 'auto' && result.status === 'payment_processing' && result.providerStage === 'authorised');
    } catch { setPreviewStatus('Unable to verify status. Do not resubmit payment.'); }
  }

  useEffect(()=>{
    if(!previewReference||!configuration)return;
    let count=0;
    const timer=window.setInterval(()=>{void checkPreviewStatus();if(++count>=40)window.clearInterval(timer);},3000);
    return()=>window.clearInterval(timer);
  // Only order identity controls the polling lifetime.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[previewReference,configuration?.environment]);

  async function capturePreviewPayment() {
    if (!captureAvailable || captureBusy || captureSubmitted || !previewOwnershipSecret) return;
    setCaptureBusy(true);
    setCaptureSubmitted(true);
    setCaptureStatus('Verifying the existing authorisation before requesting capture…');
    try {
      const response = await fetch('/api/worldpay/preview-capture', {
        method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
        body:JSON.stringify({reference:previewReference,ownershipSecret:previewOwnershipSecret}),
      });
      const result = await response.json().catch(()=>({}));
      setCaptureStatus(response.ok && result.state === 'settlement_requested'
        ? 'Capture requested. Awaiting independent settlement verification; the order remains pending.'
        : 'Capture is not confirmed. Do not retry payment or capture. Check the attempt status.');
    } catch {
      setCaptureStatus('Capture status is unresolved. Do not retry payment or capture.');
    } finally {setCaptureBusy(false);}
  }

  async function reconcilePreviewPayment() {
    if (!previewReference || !previewOwnershipSecret || reconciling) return;
    setReconciling(true);
    setReconciliationResult("Checking Worldpay Try — this does not retry or complete a payment…");
    try {
      const response = await fetch("/api/worldpay/preview-reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ reference: previewReference, ownershipSecret: previewOwnershipSecret }),
      });
      const result: { status?: string; providerState?: string; reason?: string } =
        await response.json().catch(() => ({}));
      if (!response.ok) {
        setReconciliationResult("Worldpay reconciliation is unavailable or inconclusive. Do not retry or fulfil this payment.");
        return;
      }
      const state = result.providerState === "pending" || result.providerState === "failed" ||
        result.providerState === "uncertain" ? result.providerState : "uncertain";
      const reason = typeof result.reason === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(result.reason)
        ? ` (${result.reason.replaceAll("_", " ")})` : "";
      setReconciliationResult(`Worldpay query: ${state}${reason}. Local order: ${result.status || "unknown"}. This check does not authorise, retry or mark a payment paid. Operator review is required.`);
    } catch {
      setReconciliationResult("Unable to confirm Worldpay's response. Do not retry or fulfil this payment.");
    } finally {
      setReconciling(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl md:text-4xl">Your cart</h1>
      <p className="mt-2 text-sm text-soft-black/70">Discover your favourite skincare and review your basket.</p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-soft-black/10 bg-white/60 p-8 text-center shadow-soft">
          <div className="font-display text-2xl">Cart is empty</div>
          <p className="mt-2 text-sm text-soft-black/70">Browse our collection to begin your beauty ritual.</p>
          <div className="mt-6"><ButtonLink href="/shop">Browse the collection</ButtonLink></div>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="grid gap-4">
            {items.map((it) => (
              <div key={it.slug} className="flex flex-col gap-4 rounded-2xl border border-soft-black/10 bg-white/60 p-5 shadow-soft sm:flex-row sm:items-center">
                <div className="relative h-24 w-full overflow-hidden rounded-2xl sm:h-24 sm:w-32">
                  {it.image?.startsWith("/products/bling-collections/") ? <CollectionImage src={it.image} alt={it.name} sizes="(max-width: 640px) 100vw, 128px" compact /> : it.image ? <Image src={it.image} alt={it.name} fill className="object-cover" /> : <div className="grid h-full w-full place-items-center text-xs text-soft-black/60">No image</div>}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link href={it.id.startsWith("luxury-") ? `/luxury/${it.slug}` : `/product/${it.slug}`} className="font-display text-lg hover:underline">{it.name}</Link>
                      <div className="mt-1 text-sm text-soft-black/70">{formatGBP(it.price_gbp)}</div>
                    </div>

                    <Button variant="ghost" disabled={Boolean(previewReference)} onClick={() => remove(it.slug)} className="px-3 py-2" aria-label={`Remove ${it.name}`}>Remove</Button>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <label className="text-xs text-soft-black/60">Qty</label>
                    <Input aria-label={`Quantity for ${it.name}`} disabled={Boolean(previewReference)} type="number" min={1} value={it.qty} onChange={(e) => setQty(it.slug, Number(e.target.value))} className="w-24" />
                    <div className="ml-auto text-sm font-semibold">{formatGBP(it.price_gbp * it.qty)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-soft-black/10 bg-white/60 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Subtotal</div>
              <div className="text-sm font-semibold">{formatGBP(paymentAmount!==undefined?paymentAmount/100:subtotal)}</div>
            </div>
            <div className="mt-2 text-xs text-soft-black/60">Free UK delivery. Secure payment with Worldpay.</div>

            <div className="mt-6 grid gap-3">
              <form onSubmit={e => { e.preventDefault(); void checkout(); }} className="grid gap-3">
                <h2 className="font-display text-xl">Delivery details</h2>
                <Input required aria-label="Full name" disabled={Boolean(previewReference)} placeholder="Full name" autoComplete="name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                <Input required type="email" aria-label="Email address" disabled={Boolean(previewReference)} placeholder="Email address" autoComplete="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} />
                <Input aria-label="Telephone (optional)" disabled={Boolean(previewReference)} placeholder="Telephone (optional)" autoComplete="tel" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
                <Input required aria-label="Address line 1" disabled={Boolean(previewReference)} placeholder="Address line 1" autoComplete="address-line1" value={shipping.address1} onChange={e => setShipping({ ...shipping, address1: e.target.value })} />
                <Input aria-label="Address line 2" disabled={Boolean(previewReference)} placeholder="Address line 2" autoComplete="address-line2" value={shipping.address2} onChange={e => setShipping({ ...shipping, address2: e.target.value })} />
                <Input required aria-label="Town or city" disabled={Boolean(previewReference)} placeholder="Town or city" autoComplete="address-level2" value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} />
                <Input required aria-label="UK postcode" disabled={Boolean(previewReference)} placeholder="UK postcode" autoComplete="postal-code" value={shipping.postcode} onChange={e => setShipping({ ...shipping, postcode: e.target.value })} />
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
                <Button disabled={!recoveryReady || !configuration?.available || busy || Boolean(previewReference)} className="w-full justify-center">{busy ? "Preparing…" : previewReference ? "Checkout prepared" : configuration?.environment==='try' ? "Prepare Preview secure card fields" : "Continue to secure payment"}</Button>
              </form>
              {configuration&&!configuration.available&&<p role="status" className="text-sm">Card payments are temporarily unavailable. Please contact <a className="underline" href="mailto:info@blingbeautyproducts.com">info@blingbeautyproducts.com</a>.</p>}
              {previewReference && configuration && <WorldpayPreviewFields environment={configuration.environment} amountPence={paymentAmount} reference={previewReference} checkoutId={previewCheckoutId} ownershipSecret={previewOwnershipSecret} />}
              {previewReference && <div className="rounded-xl border p-3 text-sm" role="status">
                <p>{previewStatus}</p>
                <Button variant="ghost" onClick={() => void checkPreviewStatus()} className="mt-2 w-full justify-center">{configuration?.environment==='live'?'Check payment status':'Check Preview attempt status'}</Button>
                {captureAvailable && <Button disabled={captureBusy || captureSubmitted}
                  onClick={() => void capturePreviewPayment()} className="mt-2 w-full justify-center">
                  {captureBusy ? 'Checking capture…' : captureSubmitted ? 'Capture checked — review status' : 'Capture this authorised Try payment once'}
                </Button>}
                {captureStatus && <p role="status" aria-live="polite" className="mt-2 text-xs">{captureStatus}</p>}
                {configuration?.environment==='try' && <Button variant="ghost" disabled={reconciling || !previewOwnershipSecret}
                  onClick={() => void reconcilePreviewPayment()} className="mt-2 w-full justify-center">
                  {reconciling ? "Checking Worldpay…" : "Reconcile this Worldpay Try attempt (read-only)"}
                </Button>}
                {reconciliationResult && <p role="status" aria-live="polite" className="mt-2 text-xs">{reconciliationResult}</p>}
                {configuration?.environment==='try' && <p className="mt-2 text-xs">Preview only: payment attempts may be submitted to Worldpay Try when explicitly enabled. Never enter a real card. A submitted payment is not a paid order.</p>}
              </div>}
              <ButtonLink href="/shop" variant="ghost" className="w-full justify-center">Continue browsing</ButtonLink>
              <Button disabled={Boolean(previewReference)} variant="ghost" onClick={clear} className="w-full justify-center">Clear cart</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
