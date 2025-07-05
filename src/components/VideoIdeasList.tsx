import { useState } from "react";
import { VideoPreviewModal } from "./VideoPreviewModal";
import { PublishVideoModal } from "./PublishVideoModal";
import { VideoIdeaItem } from "./VideoIdea/VideoIdeaItem";
import { useVideoIdeas } from "@/hooks/useVideoIdeas";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface VideoIdea {
  id: string;
  idea_text: string;
  selected_platforms: string[];
  status: string;
  approval_status: string;
  video_url: string | null;
  preview_video_url: string | null;
  youtube_link: string | null;
  instagram_link: string | null;
  tiktok_link: string | null;
  rejected_reason: string | null;
  created_at: string;
  caption?: string | null;
  youtube_title?: string | null;
  tiktok_title?: string | null;
  instagram_title?: string | null;
  environment_prompt?: string | null;
  sound_prompt?: string | null;
}

export const VideoIdeasList = () => {
  const { videoIdeas, loading, refetchVideoIdeas } = useVideoIdeas();
  const [selectedVideoForPreview, setSelectedVideoForPreview] = useState<VideoIdea | null>(null);
  const [selectedVideoForPublish, setSelectedVideoForPublish] = useState<VideoIdea | null>(null);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 md:p-6 border-b bg-cool-turquoise">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-semibold text-cool-charcoal">Your Videos</h2>
            <Button
              size="sm"
              variant="outline"
              className="border-cool-charcoal text-cool-charcoal hover:bg-cool-charcoal hover:text-white"
              onClick={() => {
                // Find a video that's ready to publish (has video_url and is approved)
                const publishableVideo = videoIdeas.find(v => 
                  v.video_url && 
                  (v.approval_status === 'ready_for_approval' || v.approval_status === 'approved')
                );
                if (publishableVideo) {
                  setSelectedVideoForPublish(publishableVideo);
                } else {
                  // For demo, just use the first video if available
                  if (videoIdeas.length > 0) {
                    setSelectedVideoForPublish(videoIdeas[0]);
                  }
                }
              }}
              disabled={videoIdeas.length === 0}
            >
              <Plus className="w-4 h-4 mr-1" />
              Publish
            </Button>
          </div>
        </div>
        <div className="space-y-1 overflow-hidden">
          {videoIdeas.length === 0 ? (
            <div className="p-4 md:p-6 text-center text-gray-500">
              No videos yet. Create your first video above!
            </div>
          ) : (
            videoIdeas.map((idea) => (
              <VideoIdeaItem
                key={idea.id}
                idea={idea}
                onPreviewClick={setSelectedVideoForPreview}
                onApprovalChange={refetchVideoIdeas}
              />
            ))
          )}
        </div>
      </div>

      {/* Video Preview Modal */}
      {selectedVideoForPreview && (
        <VideoPreviewModal
          isOpen={!!selectedVideoForPreview}
          onClose={() => setSelectedVideoForPreview(null)}
          videoIdea={selectedVideoForPreview}
          onApprovalChange={refetchVideoIdeas}
        />
      )}

      {/* Publish Video Modal */}
      {selectedVideoForPublish && (
        <PublishVideoModal
          isOpen={!!selectedVideoForPublish}
          onClose={() => setSelectedVideoForPublish(null)}
          videoIdea={selectedVideoForPublish}
        />
      )}
    </>
  );
};
