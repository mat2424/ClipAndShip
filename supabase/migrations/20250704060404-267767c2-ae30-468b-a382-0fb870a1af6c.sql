-- Add username column to social_tokens table to store platform-specific usernames/channel names
ALTER TABLE public.social_tokens 
ADD COLUMN username TEXT;