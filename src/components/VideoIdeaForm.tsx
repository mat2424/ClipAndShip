
import { Button } from "@/components/ui/button";
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

        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onPlatformChange={setSelectedPlatforms}
          userTier={userTier}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Generating Preview..." : "Generate Video Preview (1 Credit)"}
        </Button>
      </form>

      {/* Info about the new workflow */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>New Workflow:</strong> We'll first generate a preview video for you to review. 
          After you approve it, we'll publish it to your selected platforms.
        </p>
      </div>
    </div>
  );
};
