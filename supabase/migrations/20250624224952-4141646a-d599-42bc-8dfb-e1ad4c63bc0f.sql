
-- Create enum for social media platforms
CREATE TYPE public.social_platform AS ENUM ('youtube', 'tiktok', 'instagram', 'facebook', 'x', 'linkedin');

-- Create social_tokens table
CREATE TABLE public.social_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform social_platform NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Enable Row Level Security
ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for social_tokens
CREATE POLICY "Users can view their own social tokens" 
  ON public.social_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social tokens" 
  ON public.social_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social tokens" 
  ON public.social_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social tokens" 
  ON public.social_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
CREATE TRIGGER update_social_tokens_updated_at BEFORE UPDATE
    ON public.social_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
