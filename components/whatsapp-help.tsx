import { storeContact } from "@/lib/store-contact";

export function WhatsAppHelp() {
  return (
    <a href={`${storeContact.whatsappUrl}?text=${encodeURIComponent("Hello Bling Beauty, I need some help please.")}`}
      target="_blank" rel="noopener noreferrer" aria-label="Chat with Bling Beauty on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#20a45a] px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-[#168448] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#168448]">
      <span aria-hidden="true">✆</span> WhatsApp help
    </a>
  );
}
