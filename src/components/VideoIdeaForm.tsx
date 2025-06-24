
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock } from "lucide-react";

const PLATFORMS = [
  { name: "YouTube", tier: "free" },
  { name: "TikTok", tier: "free" },
  { name: "Instagram", tier: "free" },
  { name: "Facebook", tier: "premium" },
  { name: "X", tier: "premium" },
  { name: "LinkedIn", tier: "premium" }
];

export const VideoIdeaForm = () => {
  const [ideaText, setIdeaText] = useState("");
  const [useAiVoice, setUseAiVoice] = useState(true);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
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

  const canSelectPlatform = (platform: { name: string; tier: string }) => {
    if (platform.tier === "free") return true;
    return userTier === "premium" || userTier === "pro";
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    const platformData = PLATFORMS.find(p => p.name === platform);
    
    if (checked && platformData && !canSelectPlatform(platformData)) {
      toast({
        title: "Premium Feature",
        description: `${platform} is available for premium users only. Upgrade your account to access this platform.`,
        variant: "destructive",
      });
      return;
    }

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
          status: 'pending',
          n8n_webhook_id: webhookUrl || null
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

      // Trigger n8n webhook if provided
      if (webhookUrl && videoIdea) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            mode: "no-cors",
            body: JSON.stringify({
              video_idea_id: videoIdea.id,
              idea_text: ideaText,
              selected_platforms: selectedPlatforms,
              use_ai_voice: useAiVoice,
              voice_file_url: voiceFileUrl,
              timestamp: new Date().toISOString(),
            }),
          });
          console.log("n8n webhook triggered successfully");
        } catch (webhookError) {
          console.error("Error triggering n8n webhook:", webhookError);
          // Don't fail the whole process if webhook fails
        }
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
      setWebhookUrl("");

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
          <Label htmlFor="webhook-url">n8n Webhook URL (Optional)</Label>
          <Input
            id="webhook-url"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-n8n-instance.com/webhook/..."
          />
          <p className="text-sm text-gray-500 mt-1">
            If provided, this webhook will be triggered when video processing starts.
          </p>
        </div>

        <div>
          <Label>Select Platforms *</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PLATFORMS.map((platform) => {
              const isLocked = !canSelectPlatform(platform);
              return (
                <div key={platform.name} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform.name}
                    checked={selectedPlatforms.includes(platform.name)}
                    onCheckedChange={(checked) => handlePlatformChange(platform.name, checked as boolean)}
                    disabled={isLocked}
                  />
                  <Label 
                    htmlFor={platform.name} 
                    className={`flex items-center space-x-1 ${isLocked ? 'text-gray-400' : ''}`}
                  >
                    <span>{platform.name}</span>
                    {isLocked && <Lock className="h-3 w-3" />}
                  </Label>
                  {isLocked && (
                    <span className="text-xs text-orange-600 font-medium">Premium</span>
                  )}
                </div>
              );
            })}
          </div>
          {userTier === 'free' && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Upgrade to Premium</strong> to unlock Facebook, X, and LinkedIn platforms for wider reach!
              </p>
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Generating..." : "Generate Video (1 Credit)"}
        </Button>
      </form>
    </div>
  );
};
