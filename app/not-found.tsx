import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="font-display text-4xl">404</div>
      <p className="mt-3 text-sm text-soft-black/70">That page doesn’t exist.</p>
      <div className="mt-8 flex justify-center"><ButtonLink href="/">Back home</ButtonLink></div>
    </div>
  );
}
