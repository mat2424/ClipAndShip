
-- Update video_ideas table to support preview and approval workflow
ALTER TABLE public.video_ideas 
ADD COLUMN preview_video_url TEXT,
ADD COLUMN approval_status TEXT DEFAULT 'pending',
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejected_reason TEXT;

-- Update the status column to include new workflow states
-- First, let's see what values exist currently and update them if needed
UPDATE public.video_ideas 
SET status = 'completed' 
WHERE status = 'completed';

-- Create a constraint for approval_status values
ALTER TABLE public.video_ideas 
ADD CONSTRAINT check_approval_status 
CHECK (approval_status IN ('pending', 'preview_ready', 'approved', 'rejected'));

-- Add RLS policies for video approval actions
CREATE POLICY "Users can approve their own videos" 
  ON public.video_ideas 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for video_ideas table to support live updates
ALTER TABLE public.video_ideas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_ideas;

-- Create an index for better query performance on approval workflow
CREATE INDEX idx_video_ideas_approval_status ON public.video_ideas(approval_status);
CREATE INDEX idx_video_ideas_user_status ON public.video_ideas(user_id, status);
