
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
    <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Create New Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="idea" className="text-foreground">Video Idea *</Label>
          <Textarea
            id="idea"
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="Describe your video idea..."
            className="min-h-[100px] bg-input border-border focus:border-ring text-foreground"
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
            <Label className="text-foreground">Platform Connection Status</Label>
            <div className="space-y-1">
              {selectedPlatforms.map(platform => {
                const isConnected = connectedPlatforms.includes(platform.toLowerCase() as any);
                return (
                  <div key={platform} className="flex items-center justify-between text-sm">
                    <span className="text-foreground capitalize">{platform}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      isConnected 
                        ? 'bg-accent/20 text-accent border border-accent/30' 
                        : 'bg-destructive/20 text-destructive border border-destructive/30'
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
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive">
              <strong>Missing Connections:</strong> Please connect your {validation.missingPlatforms.join(', ')} account(s) before submitting.
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          disabled={submissionLoading || !validation.valid} 
          className="w-full bg-accent hover:bg-cool-aqua-hover text-accent-foreground"
        >
          {submissionLoading ? "Submitting..." : "Generate Video with Social Integration (1 Credit)"}
        </Button>
      </form>

      {/* Updated info about the workflow */}
      <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
        <p className="text-sm text-primary">
          <strong>Enhanced Workflow:</strong> We'll generate a preview video for your review. 
          After approval, it will be automatically published to your connected social media accounts.
        </p>
      </div>
    </div>
  );
};
