import { z } from "zod";

// User input validation schemas
export const videoIdeaSchema = z.object({
  idea_text: z.string().min(10).max(5000).trim(),
  selected_platforms: z.array(z.enum(['youtube', 'tiktok', 'instagram'])).min(1),
  use_ai_voice: z.boolean(),
  voice_file_url: z.string().url().optional().or(z.literal("")),
  environment_prompt: z.string().max(500).optional().or(z.literal("")),
  sound_prompt: z.string().max(500).optional().or(z.literal(""))
});

export const paymentSessionSchema = z.object({
  session_id: z.string().min(1),
  credits: z.number().int().min(1).max(10000)
});

export const webhookPayloadSchema = z.object({
  video_idea_id: z.string().uuid(),
  status: z.enum(['upload_complete', 'upload_failed', 'rejected']),
  platform_links: z.object({
    youtube: z.string().url().optional(),
    instagram: z.string().url().optional(),
    tiktok: z.string().url().optional()
  }).optional(),
  error_message: z.string().optional()
});

// Sanitization helpers
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const validateFileType = (filename: string, allowedTypes: string[]): boolean => {
  const extension = filename.toLowerCase().split('.').pop();
  return extension ? allowedTypes.includes(extension) : false;
};