export type Product = {
  id: string;
  slug: string;
  name: string;
  category: "Cosmetics" | "Aesthetic Enhancements";
  price_gbp: number;
  short: string;
  description: string;
  highlights: string[];
  images: string[];
  badge?: "Best Seller" | "New" | "Limited" | null;
  stripe_price_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
