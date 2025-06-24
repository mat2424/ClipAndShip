
-- Add subscription_tier column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription_tier TEXT NOT NULL DEFAULT 'free';

-- Create a check constraint to ensure valid subscription tiers
ALTER TABLE public.profiles 
ADD CONSTRAINT check_subscription_tier 
CHECK (subscription_tier IN ('free', 'premium', 'pro'));

-- Update the n8n_webhook_id column to allow storing webhook URLs (increase size if needed)
ALTER TABLE public.video_ideas 
ALTER COLUMN n8n_webhook_id TYPE TEXT;
