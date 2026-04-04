-- Migration 014: Start order_number sequence at a random 5-digit value
-- so customers can't infer order volume from the order number.
-- setval(..., value, false) means the next INSERT will get exactly that value.

SELECT setval(
  'public.orders_order_number_seq',
  floor(random() * 89999 + 10000)::int,
  false
);
