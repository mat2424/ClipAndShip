-- Add upload tracking fields to video_ideas table
ALTER TABLE public.video_ideas 
ADD COLUMN upload_status jsonb DEFAULT '{}',
ADD COLUMN upload_progress jsonb DEFAULT '{}',
ADD COLUMN upload_errors jsonb DEFAULT '{}',
ADD COLUMN youtube_video_id text,
ADD COLUMN tiktok_video_id text,
ADD COLUMN instagram_media_id text;