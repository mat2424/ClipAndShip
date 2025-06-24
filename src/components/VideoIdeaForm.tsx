
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformSelector } from "./PlatformSelector";
import { VoiceSettings } from "./VoiceSettings";
import { useVideoIdeaForm } from "@/hooks/useVideoIdeaForm";

export const VideoIdeaForm = () => {
  const {
    ideaText,
    setIdeaText,
    useAiVoice,
    setUseAiVoice,
    voiceFile,
    setVoiceFile,
    selectedPlatforms,
    setSelectedPlatforms,
    webhookUrl,
    setWebhookUrl,
    userTier,
    loading,
    handleSubmit
  } = useVideoIdeaForm();

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

        <VoiceSettings
          useAiVoice={useAiVoice}
          onUseAiVoiceChange={setUseAiVoice}
          onVoiceFileChange={setVoiceFile}
        />

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

        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onPlatformChange={setSelectedPlatforms}
          userTier={userTier}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Generating..." : "Generate Video (1 Credit)"}
        </Button>
      </form>
    </div>
  );
};
