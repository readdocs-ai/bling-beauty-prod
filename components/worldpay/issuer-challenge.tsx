"use client";
import { useEffect, useRef, useState } from "react";
import { parseIssuerChallenge } from "@/lib/worldpay/issuer-challenge.mjs";

/** Render Worldpay-supplied issuer challenge; NEVER infer payment success from iframe events.
 * Parent server coordinator must verify challenge completion with Worldpay.
 */
export default function IssuerChallenge({ challenge, onReturn }: { challenge: unknown; onReturn: () => void }) {
  const validated = parseIssuerChallenge(challenge);
  const form = useRef<HTMLFormElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (validated && !started && form.current) {
      setStarted(true);
      form.current.submit();
    }
  }, [validated?.url, validated?.jwt, validated?.reference, started]);
  useEffect(() => {
    if (!validated) return;
    const listener=(event: MessageEvent) => {
      if (event.origin!==window.location.origin ||
          event.source!==document.querySelector<HTMLIFrameElement>('iframe[name=bling-issuer-challenge-frame]')?.contentWindow ||
          !event.data || event.data.type!=='bling-worldpay-issuer-return') return;
      onReturn();
    };
    window.addEventListener('message',listener);
    return ()=>window.removeEventListener('message',listener);
  },[validated?.reference,onReturn]);
  if (!validated) return <p role="alert">Bank authentication could not be displayed safely. No payment has been confirmed.</p>;
  return <section aria-label="Bank authentication">
    <h3 className="font-semibold">Verify with your bank</h3>
    <p className="mb-2 text-sm">Complete the identity check shown below. Closing this window does not cancel or confirm a charge.</p>
    <form ref={form} method="POST" action={validated.url} target="bling-issuer-challenge-frame">
      <input type="hidden" name="JWT" value={validated.jwt} />
      <button type="submit" className="rounded border px-3 py-2">Open bank verification</button>
    </form>
    <iframe name="bling-issuer-challenge-frame" title="Secure bank identity verification" className="mt-3 h-[520px] w-full rounded border" referrerPolicy="no-referrer" />
    <p className="mt-2 text-sm" role="status">Awaiting issuer verification. Your order remains pending until Worldpay confirms the result.</p>
  </section>;
}
