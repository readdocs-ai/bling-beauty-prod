export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_gbp: number;
  stripe_price_id: string;
  image: string;
  qty: number;
};
