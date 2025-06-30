-- Add unique constraint on user_id for subscriptions table
-- This allows ON CONFLICT (user_id) to work in upsert operations

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);