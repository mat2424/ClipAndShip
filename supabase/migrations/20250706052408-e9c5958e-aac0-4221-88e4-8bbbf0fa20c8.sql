-- YouTube Tokens Table
CREATE TABLE public.youtube_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    channel_name TEXT,
    token_type TEXT NOT NULL DEFAULT 'Bearer',
    scope TEXT NOT NULL DEFAULT 'https://www.googleapis.com/auth/youtube.upload',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- YouTube Uploads Table
CREATE TABLE public.youtube_uploads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    video_id TEXT NOT NULL UNIQUE,
    video_url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    privacy_status TEXT NOT NULL DEFAULT 'public',
    upload_status TEXT NOT NULL DEFAULT 'completed',
    processing_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhook Logs Table
CREATE TABLE public.webhook_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    webhook_type TEXT NOT NULL,
    payload JSONB,
    result JSONB,
    status TEXT NOT NULL DEFAULT 'received',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.youtube_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for youtube_tokens
CREATE POLICY "Users can view their own YouTube tokens"
    ON public.youtube_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own YouTube tokens"
    ON public.youtube_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own YouTube tokens"
    ON public.youtube_tokens FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own YouTube tokens"
    ON public.youtube_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for youtube_uploads
CREATE POLICY "Users can view their own YouTube uploads"
    ON public.youtube_uploads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can insert YouTube uploads"
    ON public.youtube_uploads FOR INSERT
    WITH CHECK (true);

-- RLS Policies for webhook_logs
CREATE POLICY "Users can view their own webhook logs"
    ON public.webhook_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can manage webhook logs"
    ON public.webhook_logs FOR ALL
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_youtube_tokens_user_id ON public.youtube_tokens(user_id);
CREATE INDEX idx_youtube_tokens_expires_at ON public.youtube_tokens(expires_at);
CREATE INDEX idx_youtube_uploads_user_id ON public.youtube_uploads(user_id);
CREATE INDEX idx_youtube_uploads_video_id ON public.youtube_uploads(video_id);
CREATE INDEX idx_webhook_logs_user_id ON public.webhook_logs(user_id);
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_youtube_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_youtube_tokens_updated_at
    BEFORE UPDATE ON public.youtube_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_youtube_tokens_updated_at();