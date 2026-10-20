import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaymentResult } from "@/components/payment-result";

export default function SuccessPage({ searchParams }: { searchParams: { session_id?: string; reference?: string } }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-full border border-soft-black/10 bg-white/60 px-4 py-2 shadow-soft">
        <span className="mr-2">✨</span> <span className="text-sm font-medium">Order update</span>
      </div>

      <h1 className="font-display text-4xl">Thank you</h1>
      <PaymentResult reference={searchParams?.reference ?? ""} />

      {searchParams?.session_id && (
        <div className="mt-6 flex justify-center"><Badge>Session: {searchParams.session_id}</Badge></div>
      )}

      <div className="mt-10 flex justify-center gap-3">
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
        <ButtonLink href="/" variant="ghost">Home</ButtonLink>
      </div>
    </div>
  );
}
