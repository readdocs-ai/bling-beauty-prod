# Storefront copy and image presentation

User requested customer-facing copy throughout the storefront, WhatsApp 07459 676630, and clean image crops.

- Replaced AI/concept/proposed-content wording, design-preview badges and launch instructions on public collection, shop, about, delivery, terms and privacy pages. Collection copy describes presentation without inventing verified ingredients, sizes, efficacy or inventory.
- Updated every public WhatsApp link to https://wa.me/447459676630 and the contact page display to 07459 676630.
- Shared CollectionImage presentation clips the bottom 18 source pixels of 512x350 collection artwork using a 512x332 display frame, keeping the full artwork width and top edge. Detail images retain their 870x640 proportions. Basket thumbnails use a small additional vertical crop.
- Original image files remain intact. Both main and detail images for all six collections were visually inspected.
- Supabase public products with bling-* slugs: none returned in read-only check. The six public collections are sourced from lib/luxury-catalogue.ts.
- TypeScript passed. Production build and browser review recorded in deployment follow-up.

## Outstanding production work

Worldpay signed settlement credentials and genuine live payment remain outstanding. Paid-order customer/admin email delivery and the first Royal Mail OLP draft import must be verified against that payment. The legal trading identity and postal contact address still need owner confirmation for the public business details; removing developer notes does not supply those facts. Product contents, stock, fulfilment timing and supplier details should be confirmed by the owner before accepting orders. Payment guards remain in place.

## Live verification follow-up

Production build READY at c790036; live browser review confirmed clean collection crops and customer copy, updated WhatsApp destinations and a £130 collection added to the basket without initiating payment. Fixed the transient checkout loading label so live customers cannot briefly see Preview diagnostics before configuration loads. The explicit Try environment retains its test-only messaging.
