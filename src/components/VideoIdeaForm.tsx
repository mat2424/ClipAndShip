
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformSelector } from "./PlatformSelector";
import { VoiceSettings } from "./VoiceSettings";
import { useVideoIdeaForm } from "@/hooks/useVideoIdeaForm";
import { useVideoSubmissionWithTokens } from "@/hooks/useVideoSubmissionWithTokens";

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
  } = useVideoIdeaForm();

  const {
    connectedTokens,
    loading: submissionLoading,
    validatePlatformConnections,
    submitVideoWithTokens
  } = useVideoSubmissionWithTokens();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim() || selectedPlatforms.length === 0) {
      return;
    }

    const success = await submitVideoWithTokens(
      ideaText,
      selectedPlatforms,
      useCustomVoice,
      voiceFile
    );

    if (success) {
      // Reset form
      setIdeaText("");
      setSelectedPlatforms([]);
      setVoiceFile(null);
      setUseCustomVoice(false);
    }
  };

  // Check platform connections for display
  const validation = validatePlatformConnections(selectedPlatforms);
  const connectedPlatforms = connectedTokens.map(token => token.platform);

  return (
    <div className="bg-[#621fff] rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Create New Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="idea" className="text-white">Video Idea *</Label>
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

        {/* Connection Status Display */}
        {selectedPlatforms.length > 0 && (
          <div className="space-y-2">
            <Label className="text-white">Platform Connection Status</Label>
            <div className="space-y-1">
              {selectedPlatforms.map(platform => {
                const isConnected = connectedPlatforms.includes(platform as any);
                return (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <span className="text-white capitalize">{platform}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      isConnected 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Warning for missing connections */}
        {!validation.valid && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Missing Connections:</strong> Please connect your {validation.missingPlatforms.join(', ')} account(s) before submitting.
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={submissionLoading || !validation.valid} 
          className="w-full"
        >
          {submissionLoading ? "Submitting..." : "Generate Video with Social Integration (1 Credit)"}
        </Button>
      </form>

      {/* Updated info about the workflow */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Enhanced Workflow:</strong> We'll generate a preview video for your review. 
          After approval, it will be automatically published to your connected social media accounts.
        </p>
      </div>
    </div>
  );
};
