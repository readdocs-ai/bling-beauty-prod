'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart/cart-context';
import { Button } from '@/components/ui/button';

export default function PayPalConfirmation({ orderId }: { orderId: string }) {
  const { clear } = useCart();
  const clearCart = useRef(clear);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<'checking' | 'paid' | 'pending'>('checking');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    async function check() {
      try {
        const response = await fetch('/api/paypal/complete', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }), cache: 'no-store', signal: controller.signal,
        });
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (response.ok && result.state === 'paid' && typeof result.orderNumber === 'string') {
          clearCart.current();
          setOrderNumber(result.orderNumber);
          setState('paid');
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }
      setState('pending');
    }
    void check();
    return () => controller.abort();
  }, [orderId, attempt]);

  return (
    <div className="mt-4 grid gap-4" role="status">
      {state === 'checking' && <p>Checking your PayPal payment…</p>}
      {state === 'paid' && <p>Payment confirmed. Your order number is <strong>{orderNumber}</strong>.</p>}
      {state === 'pending' && <>
        <p>We’re still confirming your payment. Please check again before placing another order.</p>
        <Button type="button" onClick={() => { setState('checking'); setAttempt(value => value + 1); }}>
          Check payment status
        </Button>
        <a className="underline" href="mailto:info@blingbeautyproducts.com">Contact Bling Beauty</a>
      </>}
    </div>
  );
}
