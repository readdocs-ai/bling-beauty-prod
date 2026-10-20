-- Bling Beauty: catalogue preparation for the six GBP 130 luxury products.
-- Run in the Bling Beauty Supabase SQL Editor only after reviewing the six exact items.
-- Does not touch orders, customer records, or RLS policies.
BEGIN;
-- Stripe is retired. Keep the legacy column for now but do not require a Stripe ID for new items.
ALTER TABLE public.products ALTER COLUMN stripe_price_id DROP NOT NULL;

-- Hide the discontinued SADOER listing; retain its historical record.
UPDATE public.products SET is_active = false, updated_at = now()
WHERE slug = 'sadoer-vitamin-c-gift-set';

INSERT INTO public.products (slug, name, category, price_gbp, short, description, highlights, images, badge, is_active)
VALUES
('elemis-results-around-the-clock','ELEMIS Results Around the Clock','Cosmetics',130.00,'Day & night moisturising ritual','Two full-size Pro-Collagen moisturisers, designed as a day-to-night skincare pairing.',ARRAY[]::text[],ARRAY[]::text[],'New',true),
('lancome-absolue-eye-cream-collection','LANCÔME Absolue Eye Cream Collection','Cosmetics',130.00,'Prestige eye-care gifting','A luxury eye-care gift collection from Lancôme’s Absolue skincare range.',ARRAY[]::text[],ARRAY[]::text[],'New',true),
('elemis-aston-martin-deluxe','ELEMIS Aston Martin F1 Deluxe Skincare Collection','Cosmetics',130.00,'A refined skincare gift','A premium skincare collection presented with motorsport-inspired styling.',ARRAY[]::text[],ARRAY[]::text[],'New',true),
('shiseido-vital-perfection-pouch','SHISEIDO Vital Perfection Pouch Set','Cosmetics',130.00,'Japanese prestige skincare','A gift-ready skincare ritual from the Shiseido Vital Perfection collection. Exact edition and contents require confirmation.',ARRAY[]::text[],ARRAY[]::text[],'New',true),
('elemis-renew-rejuvenate-trio','ELEMIS Renew & Rejuvenate Trio','Cosmetics',130.00,'A three-step facial care edit','A Pro-Collagen trio bringing together moisturising, serum and eye-care essentials.',ARRAY[]::text[],ARRAY[]::text[],'New',true),
('shiseido-plumping-tightening-ritual','SHISEIDO Plumping & Tightening Ritual','Cosmetics',130.00,'A sophisticated serum ritual','A prestige serum-focused skincare collection from Shiseido.',ARRAY[]::text[],ARRAY[]::text[],'New',true)
ON CONFLICT (slug) DO UPDATE SET
 name = EXCLUDED.name, category = EXCLUDED.category, price_gbp = EXCLUDED.price_gbp,
 short = EXCLUDED.short, description = EXCLUDED.description,
 is_active = true, updated_at = now();
COMMIT;

-- Verify: should show six active luxury items at 130, and inactive SADOER.
SELECT slug, name, price_gbp, is_active FROM public.products ORDER BY slug;
