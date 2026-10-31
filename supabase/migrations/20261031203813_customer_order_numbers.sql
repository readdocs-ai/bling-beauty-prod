-- Public order numbers are independent of provider references and access credentials.
ALTER TABLE public.bling_paid_orders ADD COLUMN order_number bigint GENERATED ALWAYS AS IDENTITY (START WITH 100001) NOT NULL UNIQUE;
GRANT USAGE,SELECT ON SEQUENCE public.bling_paid_orders_order_number_seq TO service_role;
