
import { useState } from "react";
import { VideoPreviewModal } from "./VideoPreviewModal";
import { VideoIdeaItem } from "./VideoIdea/VideoIdeaItem";
import { useVideoIdeas } from "@/hooks/useVideoIdeas";

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

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b bg-cool-turquoise">
          <h2 className="text-xl font-semibold mb-4 text-cool-charcoal">Your Videos</h2>
        </div>
        <div className="divide-y">
          {videoIdeas.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
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
    </>
  );
};
