"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseIssuerChallenge } from "@/lib/worldpay/issuer-challenge.mjs";
import { buildChallengeDocument } from "@/lib/worldpay/challenge-document.mjs";

/** Worldpay Try issuer challenge. The form is submitted from within the iframe.
 * A browser callback is NOT proof of payment or of completed authentication.
 */
export default function IssuerChallenge({ challenge, onReturn }: { challenge: unknown; onReturn: () => void }) {
  const validated = useMemo(() => parseIssuerChallenge(challenge), [challenge]);
  const [openedReference, setOpenedReference] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const returnedReference = useRef<string | null>(null);
  const srcDoc = validated && openedReference === validated.reference ? buildChallengeDocument(validated) : undefined;

  useEffect(() => {
    if (!validated) return;
    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow ||
          !event.data || event.data.type !== 'bling-worldpay-issuer-return' ||
          event.data.challengeReference !== validated.reference ||
          returnedReference.current === validated.reference) return;
      returnedReference.current = validated.reference;
      onReturn();
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [validated?.reference, onReturn]);

  if (!validated) return <p role="alert">Bank authentication could not be displayed safely. No payment has been confirmed.</p>;
  return <section aria-label="Bank authentication">
    <h3 className="font-semibold">Verify with your bank</h3>
    <p className="mb-2 text-sm">Complete the identity check shown below. Closing this window does not cancel or confirm a charge.</p>
    <button type="button" disabled={openedReference === validated.reference}
      onClick={() => setOpenedReference(validated.reference)} className="rounded border px-3 py-2 disabled:opacity-50">
      {openedReference === validated.reference ? 'Bank verification opened' : 'Open bank verification'}
    </button>
    <iframe ref={frame} name="bling-issuer-challenge-frame" title="Secure bank identity verification"
      srcDoc={srcDoc} className="mt-3 h-[520px] w-full rounded border" referrerPolicy="no-referrer" />
    <p className="mt-2 text-sm" role="status">Awaiting issuer verification. Your order remains pending until Worldpay confirms the result.</p>
    <details className="mt-2 text-xs"><summary>Preview bank-screen diagnostics</summary>
      <p>Initial bank service: {new URL(validated.url).origin}</p>
      <p>Checkout origin must match the authentication return origin. No card details or authentication tokens are shown here.</p>
    </details>
  </section>;
}
