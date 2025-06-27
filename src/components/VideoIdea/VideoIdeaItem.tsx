
import { ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoIdeaStatusBadge } from "./VideoIdeaStatusBadge";

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
}

interface VideoIdeaItemProps {
  idea: VideoIdea;
  onPreviewClick: (idea: VideoIdea) => void;
}

const getPlatformLinks = (idea: VideoIdea) => {
  const links = [];
  if (idea.youtube_link) links.push({ platform: 'YouTube', url: idea.youtube_link });
  if (idea.instagram_link) links.push({ platform: 'Instagram', url: idea.instagram_link });
  if (idea.tiktok_link) links.push({ platform: 'TikTok', url: idea.tiktok_link });
  return links;
};

export const VideoIdeaItem = ({ idea, onPreviewClick }: VideoIdeaItemProps) => {
  return (
    <div className="p-6 bg-cool-turquoise">
      <div className="flex justify-between items-start mb-2">
        <p className="flex-1 mr-4 text-cool-charcoal font-semibold text-2xl text-left">
          {idea.idea_text}
        </p>
        <div className="flex gap-2 items-center">
          <VideoIdeaStatusBadge idea={idea} />
          
          {/* Preview Button */}
          {idea.approval_status === 'preview_ready' && idea.preview_video_url && (
            <Button
              size="sm"
              onClick={() => onPreviewClick(idea)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Eye className="w-3 h-3 mr-1" />
              Review
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-2">
        {idea.selected_platforms.map((platform) => (
          <span key={platform} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            {platform}
          </span>
        ))}
      </div>
      
      {/* Rejection Reason */}
      {idea.approval_status === 'rejected' && idea.rejected_reason && (
        <div className="mb-2">
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong className="text-xs text-black">Rejection reason:</strong> {idea.rejected_reason}
          </p>
        </div>
      )}

      {/* Video file link */}
      {idea.video_url && (
        <div className="mb-2">
          <a
            href={idea.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            <ExternalLink className="h-3 w-3" />
            View Video File
          </a>
        </div>
      )}

      {/* Platform links */}
      {getPlatformLinks(idea).length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1">Platform Links:</p>
          <div className="flex flex-wrap gap-2">
            {getPlatformLinks(idea).map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded"
              >
                <ExternalLink className="h-3 w-3" />
                {link.platform}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-cool-charcoal">
        {new Date(idea.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};
