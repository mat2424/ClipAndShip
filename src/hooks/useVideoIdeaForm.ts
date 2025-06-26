
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WebhookResponse {
  video_file: string;
  youtube_link: string;
  instagram_link: string;  
  tiktok_link: string;
  preview_video_url?: string;
}

export const useVideoIdeaForm = () => {
  const [ideaText, setIdeaText] = useState("");
  const [useCustomVoice, setUseCustomVoice] = useState(false);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [userTier, setUserTier] = useState<string>("free");
  const [loading, setLoading] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<WebhookResponse | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserTier();
  }, []);

  const fetchUserTier = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user tier:', error);
      } else {
        setUserTier(data?.subscription_tier || 'free');
      }
    } catch (error) {
      console.error('Error fetching user tier:', error);
    }
  };

  const handleVoiceFileUpload = async (file: File) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('voice-files')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('voice-files')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim() || selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select at least one platform.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setWebhookResponse(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user has enough credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (!profile || profile.credits < 1) {
        toast({
          title: "Insufficient Credits",
          description: "You need at least 1 credit to generate a video. Please purchase credits.",
          variant: "destructive",
        });
        return;
      }

      let voiceFileUrl = null;
      if (useCustomVoice && voiceFile) {
        voiceFileUrl = await handleVoiceFileUpload(voiceFile);
      }

      // Create video idea record with new approval workflow fields
      const { data: videoIdea, error } = await supabase
        .from('video_ideas')
        .insert({
          user_id: user.id,
          idea_text: ideaText,
          use_ai_voice: !useCustomVoice, // Invert the logic
          voice_file_url: voiceFileUrl,
          selected_platforms: selectedPlatforms,
          status: 'processing',
          approval_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Call the webhook for preview generation (phase 1)
      const { data: webhookData, error: webhookError } = await supabase.functions.invoke('call-n8n-webhook', {
        body: {
          phase: 'preview',
          video_idea_id: videoIdea.id,
          video_idea: ideaText,
          selected_platforms: selectedPlatforms,
          use_ai_voice: !useCustomVoice // Invert the logic
        }
      });

      if (webhookError) {
        // Don't log webhook errors, just throw a generic error
        throw new Error("Failed to start video generation");
      }

      console.log("Webhook response:", webhookData);

      // For preview phase, we don't get final links yet
      if (webhookData.preview_video_url) {
        // Update the video idea with preview URL
        const { error: updateError } = await supabase
          .from('video_ideas')
          .update({
            approval_status: 'preview_ready',
            preview_video_url: webhookData.preview_video_url,
            status: 'preview_ready'
          })
          .eq('id', videoIdea.id);

        if (updateError) {
          console.error("Error updating video idea:", updateError);
        }

        toast({
          title: "Preview Generated!",
          description: "Your video preview is ready for review. Check the video list below.",
        });
      }

      // Deduct credit
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - 1 })
        .eq('id', user.id);

      if (creditError) throw creditError;

      // Record credit transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -1,
          transaction_type: 'usage',
          description: 'Video generation'
        });

      // Reset form
      setIdeaText("");
      setSelectedPlatforms([]);
      setVoiceFile(null);
      setUseCustomVoice(false);

    } catch (error: any) {
      // Only show user-friendly error messages
      toast({
        title: "Error",
        description: error.message || "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    ideaText,
    setIdeaText,
    useCustomVoice,
    setUseCustomVoice,
    voiceFile,
    setVoiceFile,
    selectedPlatforms,
    setSelectedPlatforms,
    userTier,
    loading,
    webhookResponse,
    handleSubmit
  };
};
