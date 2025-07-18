-- Create table for health check logs
CREATE TABLE public.health_check_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL, -- 'success', 'failure', 'timeout'
  response_time_ms INTEGER,
  error_message TEXT,
  source TEXT NOT NULL DEFAULT 'n8n', -- who performed the check
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.health_check_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for monitoring dashboards)
CREATE POLICY "Health check logs are publicly readable" 
ON public.health_check_logs 
FOR SELECT 
USING (true);

-- Create policy for service writes
CREATE POLICY "Services can insert health check logs" 
ON public.health_check_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient time-based queries
CREATE INDEX idx_health_check_logs_timestamp ON public.health_check_logs(timestamp DESC);
CREATE INDEX idx_health_check_logs_status ON public.health_check_logs(status, timestamp DESC);