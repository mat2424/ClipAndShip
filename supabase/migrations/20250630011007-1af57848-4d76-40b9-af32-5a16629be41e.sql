
-- Add new columns to video_ideas table for enhanced metadata
ALTER TABLE public.video_ideas 
ADD COLUMN caption TEXT,
ADD COLUMN youtube_title TEXT,
ADD COLUMN tiktok_title TEXT,
ADD COLUMN instagram_title TEXT,
ADD COLUMN environment_prompt TEXT,
ADD COLUMN sound_prompt TEXT;

-- Update the approval_status constraint to include new statuses
ALTER TABLE public.video_ideas 
DROP CONSTRAINT IF EXISTS check_approval_status;

ALTER TABLE public.video_ideas 
ADD CONSTRAINT check_approval_status 
CHECK (approval_status IN ('pending', 'preview_ready', 'ready_for_approval', 'approved', 'rejected', 'published'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_video_ideas_ready_for_approval ON public.video_ideas(approval_status) WHERE approval_status = 'ready_for_approval';
