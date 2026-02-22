# Bling Beauty Products — Ecommerce (Stripe + Admin Dashboard + Product Gallery)

Included:
- **Stripe Checkout** payments
- **Free UK shipping** (GB-only shipping address collection + £0 shipping option)
- **Supabase** database for products
- **Admin dashboard** to add/edit products + image gallery URLs + Stripe price IDs
- Product gallery on product pages (thumbnails)

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase setup
1. Create a Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Add keys to `.env.local`:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## Stripe setup
- Put `STRIPE_SECRET_KEY` in `.env.local`
- Set `NEXT_PUBLIC_SITE_URL` (local: http://localhost:3000)
- Create products/prices in Stripe and paste each product’s `price_...` into the Admin dashboard

## Admin
- Set `ADMIN_USERNAME` + `ADMIN_PASSWORD` in `.env.local`
- Visit `/admin`
