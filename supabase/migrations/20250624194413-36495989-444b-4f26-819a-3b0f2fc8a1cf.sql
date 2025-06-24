
-- Add the missing platform link columns to the video_ideas table
ALTER TABLE public.video_ideas 
ADD COLUMN youtube_link TEXT,
ADD COLUMN instagram_link TEXT,
ADD COLUMN tiktok_link TEXT;
