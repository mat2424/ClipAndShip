
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, Download } from "lucide-react";

interface WebhookResponse {
  video_file: string;
  youtube_link: string;
  instagram_link: string;
  tiktok_link: string;
}

const GenerateVideo = () => {
  const [videoIdea, setVideoIdea] = useState("");
  const [useAiVoice, setUseAiVoice] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<WebhookResponse | null>(null);
  const { toast } = useToast();

  const platforms = [
    { id: "youtube", label: "YouTube" },
    { id: "tiktok", label: "TikTok" },
    { id: "instagram", label: "Instagram" }
  ];

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms(prev => [...prev, platformId]);
    } else {
      setSelectedPlatforms(prev => prev.filter(p => p !== platformId));
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoIdea.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video idea.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one platform.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setWebhookResponse(null);

    try {
      const response = await fetch("https://kazzz24.app.n8n.cloud/webhook-test/9a1ec0db-1b93-4c5e-928f-a003ece93ba9", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          video_idea: videoIdea,
          selected_platforms: selectedPlatforms,
          use_ai_voice: useAiVoice
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: WebhookResponse = await response.json();
      setWebhookResponse(data);

      toast({
        title: "Success!",
        description: "Video generated successfully!",
      });
    } catch (error: any) {
      console.error("Error generating video:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Generate Video</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            {/* Video Idea Input */}
            <div>
              <Label htmlFor="video-idea">Video Idea</Label>
              <Textarea
                id="video-idea"
                value={videoIdea}
                onChange={(e) => setVideoIdea(e.target.value)}
                placeholder="Describe your video idea..."
                className="min-h-[120px] mt-2"
              />
            </div>

            {/* Use AI Voice Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ai-voice"
                checked={useAiVoice}
                onCheckedChange={(checked) => setUseAiVoice(checked as boolean)}
              />
              <Label htmlFor="ai-voice">Use AI Voice</Label>
            </div>

            {/* Platform Selection */}
            <div>
              <Label>Platform Selection</Label>
              <div className="mt-2 space-y-2">
                {platforms.map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                    />
                    <Label htmlFor={platform.id}>{platform.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateVideo} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Generating..." : "Generate Video"}
            </Button>

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
        </div>
      </main>
    </div>
  );
};

export default GenerateVideo;
