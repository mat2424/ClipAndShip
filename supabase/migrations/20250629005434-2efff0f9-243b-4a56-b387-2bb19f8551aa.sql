
-- Create pending_videos table for approval workflow
CREATE TABLE public.pending_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  execution_id TEXT UNIQUE,
  video_url TEXT,
  idea TEXT NOT NULL,
  caption TEXT,
  titles_descriptions JSONB,
  upload_targets TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending_approval',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT
);

-- Enable RLS on pending_videos table
ALTER TABLE public.pending_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pending_videos
CREATE POLICY "Users can view their own pending videos" 
  ON public.pending_videos 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending videos" 
  ON public.pending_videos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending videos" 
  ON public.pending_videos 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending videos" 
  ON public.pending_videos 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Update social_tokens table to ensure proper token storage for YouTube
-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_tokens_user_platform ON public.social_tokens(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_pending_videos_user_status ON public.pending_videos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_pending_videos_execution_id ON public.pending_videos(execution_id);
