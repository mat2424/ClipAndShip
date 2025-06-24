
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformSelector } from "./PlatformSelector";
import { VoiceSettings } from "./VoiceSettings";
import { useVideoIdeaForm } from "@/hooks/useVideoIdeaForm";
import { ExternalLink, Download } from "lucide-react";

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
    userTier,
    loading,
    webhookResponse,
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

        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onPlatformChange={setSelectedPlatforms}
          userTier={userTier}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Generating..." : "Generate Video (1 Credit)"}
        </Button>
      </form>

      {/* Results Display */}
      {webhookResponse && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Video Generated Successfully!</h3>
          <div className="space-y-2">
            {/* Download Video */}
            {webhookResponse.video_file && (
              <a
                href={webhookResponse.video_file}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Download className="h-4 w-4" />
                Download Video
              </a>
            )}

            {/* YouTube Link */}
            {webhookResponse.youtube_link && (
              <a
                href={webhookResponse.youtube_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Watch on YouTube
              </a>
            )}

            {/* Instagram Link */}
            {webhookResponse.instagram_link && (
              <a
                href={webhookResponse.instagram_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Watch on Instagram
              </a>
            )}

            {/* TikTok Link */}
            {webhookResponse.tiktok_link && (
              <a
                href={webhookResponse.tiktok_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Watch on TikTok
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
