import { storeContact } from "@/lib/store-contact";

export const metadata = { title: "Contact | Bling Beauty" };

export default function ContactPage() {
  return (
    <main className="luxury-page min-h-[65vh] px-5 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl text-[#332b29]">Get in touch</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#64554b]">
          Questions about a collection, an order or delivery? Our team is happy to help.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <a className="rounded-xl border border-[#e6d7c8] bg-white p-5 hover:border-[#b79679]" href={`mailto:${storeContact.email}`}>
            <span className="text-sm text-[#715340]">Email us</span>
            <div className="mt-2 break-all font-semibold">{storeContact.email}</div>
          </a>
          <a className="rounded-xl border border-[#e6d7c8] bg-white p-5 hover:border-[#b79679]" href={storeContact.phoneUrl}>
            <span className="text-sm text-[#715340]">Call us</span>
            <div className="mt-2 font-semibold">{storeContact.phone}</div>
          </a>
        </div>
        <a className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold underline hover:text-[#715340]" href={`${storeContact.whatsappUrl}?text=Hello%20Bling%20Beauty`} target="_blank" rel="noopener noreferrer">
          Chat on WhatsApp <span aria-hidden="true" className="ml-2">↗</span>
        </a>
      </div>
    </main>
  );
}
