
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
    useCustomVoice,
    setUseCustomVoice,
    voiceFile,
    setVoiceFile,
    selectedPlatforms,
    setSelectedPlatforms,
    userTier,
    loading,
    handleSubmit
  } = useVideoIdeaForm();

  return (
    <div className="bg-cool-navy rounded-xl shadow-lg p-6 border border-cool-sky/20">
      <h2 className="text-xl font-semibold mb-4 text-cool-white">Create New Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="idea" className="text-cool-light">Video Idea *</Label>
          <Textarea
            id="idea"
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="Describe your video idea..."
            className="min-h-[100px] bg-cool-charcoal border-cool-gray/30 text-cool-white placeholder:text-cool-gray focus:border-cool-sky"
            required
          />
        </div>

        <VoiceSettings
          useCustomVoice={useCustomVoice}
          onUseCustomVoiceChange={setUseCustomVoice}
          onVoiceFileChange={setVoiceFile}
          userTier={userTier}
        />

        <PlatformSelector
          selectedPlatforms={selectedPlatforms}
          onPlatformChange={setSelectedPlatforms}
          userTier={userTier}
        />

        <Button 
          type="submit" 
          disabled={loading || !ideaText.trim() || selectedPlatforms.length === 0} 
          className="w-full bg-cool-aqua hover:bg-cool-aqua-hover text-cool-charcoal font-medium"
        >
          {loading ? "Generating..." : (
            <>
              <span className="hidden sm:inline">Generate Video (1 Credit)</span>
              <span className="sm:hidden">Generate Video (1 Credit)</span>
            </>
          )}
        </Button>
      </form>

      {/* Updated info about the workflow */}
      <div className="mt-4 p-3 bg-cool-sky/10 border border-cool-sky/30 rounded-lg">
        <p className="text-sm text-cool-sky">
          <strong>Simple Workflow:</strong> We'll generate a preview video for your review. 
          You can download and share it on your preferred platforms.
        </p>
      </div>
    </div>
  );
};
