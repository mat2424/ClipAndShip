
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlatformSelector } from "./PlatformSelector";
import { VoiceSettings } from "./VoiceSettings";
import { useVideoIdeaForm } from "@/hooks/useVideoIdeaForm";
import { useSocialTokens } from "@/hooks/useSocialTokens";
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

  // Use the same hook as the connect accounts page for consistency
  const { connectedAccounts } = useSocialTokens();

  const {
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

  // Check platform connections for display using the same data source
  const validation = validatePlatformConnections(selectedPlatforms);
  const connectedPlatforms = connectedAccounts.map(token => token.platform);

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

        {/* Connection Status Display */}
        {selectedPlatforms.length > 0 && (
          <div className="space-y-2">
            <Label className="text-cool-light">Platform Connection Status</Label>
            <div className="space-y-1">
              {selectedPlatforms.map(platform => {
                const isConnected = connectedPlatforms.includes(platform.toLowerCase() as any);
                return (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <span className="text-cool-light capitalize">{platform}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      isConnected 
                        ? 'bg-cool-aqua/20 text-cool-aqua border border-cool-aqua/30' 
                        : 'bg-cool-rose/20 text-cool-rose border border-cool-rose/30'
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
          <div className="p-3 bg-cool-rose/10 border border-cool-rose/30 rounded-lg">
            <p className="text-sm text-cool-rose">
              <strong>Missing Connections:</strong> Please connect your {validation.missingPlatforms.join(', ')} account(s) before submitting.
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={submissionLoading || !validation.valid} 
          className="w-full bg-cool-aqua hover:bg-cool-aqua-hover text-cool-charcoal font-medium"
        >
          {submissionLoading ? "Submitting..." : "Generate Video with Social Integration (1 Credit)"}
        </Button>
      </form>

      {/* Updated info about the workflow */}
      <div className="mt-4 p-3 bg-cool-sky/10 border border-cool-sky/30 rounded-lg">
        <p className="text-sm text-cool-sky">
          <strong>Enhanced Workflow:</strong> We'll generate a preview video for your review. 
          After approval, it will be automatically published to your connected social media accounts.
        </p>
      </div>
    </div>
  );
};
