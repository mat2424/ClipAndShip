
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useVideoIdeaForm = () => {
  const [ideaText, setIdeaText] = useState("");
  const [useAiVoice, setUseAiVoice] = useState(true);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [userTier, setUserTier] = useState<string>("free");
  const [loading, setLoading] = useState(false);
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
      if (!useAiVoice && voiceFile) {
        voiceFileUrl = await handleVoiceFileUpload(voiceFile);
      }

      // Create video idea record
      const { data: videoIdea, error } = await supabase
        .from('video_ideas')
        .insert({
          user_id: user.id,
          idea_text: ideaText,
          use_ai_voice: useAiVoice,
          voice_file_url: voiceFileUrl,
          selected_platforms: selectedPlatforms,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct credit
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - 1 })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Record credit transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -1,
          transaction_type: 'usage',
          description: 'Video generation'
        });

      // Call video generation webhook
      const { error: webhookError } = await supabase.functions.invoke('generate-video', {
        body: {
          video_idea_id: videoIdea.id,
          video_idea: ideaText,
          selected_platforms: selectedPlatforms,
          use_ai_voice: useAiVoice,
          voice_file_url: voiceFileUrl
        }
      });

      if (webhookError) {
        console.error("Error calling video generation webhook:", webhookError);
        // Don't fail the whole process if webhook fails
      }

      toast({
        title: "Success!",
        description: "Your video idea has been submitted for processing.",
      });

      // Reset form
      setIdeaText("");
      setSelectedPlatforms([]);
      setVoiceFile(null);
      setUseAiVoice(true);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    ideaText,
    setIdeaText,
    useAiVoice,
    setUseAiVoice,
    voiceFile,
    setVoiceFile,
    selectedPlatforms,
    setSelectedPlatforms,
    userTier,
    loading,
    handleSubmit
  };
};
