import Link from 'next/link';
import PayPalConfirmation from './paypal-confirmation';

export const metadata = { title: 'Order confirmation', robots: { index: false, follow: false } };

export default async function PayPalReturn({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const orderId = typeof token === 'string' && /^[A-Za-z0-9]{1,50}$/.test(token) ? token : null;
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-4xl">Order confirmation</h1>
      {orderId ? <PayPalConfirmation orderId={orderId} /> :
        <p className="mt-4">This confirmation link is incomplete. If you paid, check your email or contact us.</p>}
      <Link href="/shop" className="mt-6 inline-block underline">Back to the shop</Link>
    </main>
  );
}
