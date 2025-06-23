
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const PLATFORMS = [
  "YouTube",
  "TikTok", 
  "Instagram",
  "Facebook",
  "Twitter",
  "LinkedIn"
];

export const VideoIdeaForm = () => {
  const [ideaText, setIdeaText] = useState("");
  const [useAiVoice, setUseAiVoice] = useState(true);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePlatformChange = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    } else {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
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
      // Check if user has enough credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
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
      const { error } = await supabase
        .from('video_ideas')
        .insert({
          idea_text: ideaText,
          use_ai_voice: useAiVoice,
          voice_file_url: voiceFileUrl,
          selected_platforms: selectedPlatforms,
          status: 'pending'
        });

      if (error) throw error;

      // Deduct credit
      await supabase.rpc('increment', {
        table_name: 'profiles',
        row_id: (await supabase.auth.getUser()).data.user?.id,
        column_name: 'credits',
        x: -1
      });

      // Record credit transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          amount: -1,
          transaction_type: 'usage',
          description: 'Video generation'
        });

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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="idea">Video Idea *</Label>
          <Textarea
            id="idea"
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="Describe your video idea..."
            className="min-h-[100px]"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="ai-voice"
            checked={useAiVoice}
            onCheckedChange={(checked) => setUseAiVoice(checked as boolean)}
          />
          <Label htmlFor="ai-voice">Use AI Voice</Label>
        </div>

        {!useAiVoice && (
          <div>
            <Label htmlFor="voice-file">Upload Voice File</Label>
            <Input
              id="voice-file"
              type="file"
              accept="audio/*"
              onChange={(e) => setVoiceFile(e.target.files?.[0] || null)}
            />
          </div>
        )}

        <div>
          <Label>Select Platforms *</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PLATFORMS.map((platform) => (
              <div key={platform} className="flex items-center space-x-2">
                <Checkbox
                  id={platform}
                  checked={selectedPlatforms.includes(platform)}
                  onCheckedChange={(checked) => handlePlatformChange(platform, checked as boolean)}
                />
                <Label htmlFor={platform}>{platform}</Label>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Generating..." : "Generate Video (1 Credit)"}
        </Button>
      </form>
    </div>
  );
};
