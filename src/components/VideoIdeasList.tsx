import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Eye, Clock, CheckCircle, XCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPreviewModal } from "./VideoPreviewModal";
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
export const VideoIdeasList = () => {
  const [videoIdeas, setVideoIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideoForPreview, setSelectedVideoForPreview] = useState<VideoIdea | null>(null);
  useEffect(() => {
    fetchVideoIdeas();

    // Subscribe to video ideas changes for real-time updates
    const channel = supabase.channel('video-ideas-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'video_ideas'
    }, () => fetchVideoIdeas()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const fetchVideoIdeas = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('video_ideas').select('id, idea_text, selected_platforms, status, approval_status, video_url, preview_video_url, youtube_link, instagram_link, tiktok_link, rejected_reason, created_at').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setVideoIdeas(data || []);
    } catch (error) {
      console.error('Error fetching video ideas:', error);
    } finally {
      setLoading(false);
    }
  };
  const getStatusDisplay = (idea: VideoIdea) => {
    const {
      status,
      approval_status
    } = idea;
    if (approval_status === 'preview_ready') {
      return {
        text: 'Preview Ready',
        color: 'bg-blue-100 text-blue-800',
        icon: <Eye className="w-3 h-3" />
      };
    }
    if (approval_status === 'approved' && status === 'publishing') {
      return {
        text: 'Publishing...',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <Upload className="w-3 h-3" />
      };
    }
    if (approval_status === 'approved' && status === 'completed') {
      return {
        text: 'Published',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-3 h-3" />
      };
    }
    if (approval_status === 'rejected') {
      return {
        text: 'Rejected',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-3 h-3" />
      };
    }

    // Default status mapping for older entries or edge cases
    switch (status) {
      case 'completed':
        return {
          text: 'Completed',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="w-3 h-3" />
        };
      case 'processing':
        return {
          text: 'Generating...',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="w-3 h-3" />
        };
      case 'failed':
        return {
          text: 'Failed',
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="w-3 h-3" />
        };
      default:
        return {
          text: 'Pending',
          color: 'bg-gray-100 text-gray-800',
          icon: <Clock className="w-3 h-3" />
        };
    }
  };
  const getPlatformLinks = (idea: VideoIdea) => {
    const links = [];
    if (idea.youtube_link) links.push({
      platform: 'YouTube',
      url: idea.youtube_link
    });
    if (idea.instagram_link) links.push({
      platform: 'Instagram',
      url: idea.instagram_link
    });
    if (idea.tiktok_link) links.push({
      platform: 'TikTok',
      url: idea.tiktok_link
    });
    return links;
  };
  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }
  return <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b bg-[#621fff]">
          <h2 className="text-xl font-semibold text-zinc-950">Your Videos</h2>
        </div>
        <div className="divide-y">
          {videoIdeas.length === 0 ? <div className="p-6 text-center text-gray-500">
              No videos yet. Create your first video above!
            </div> : videoIdeas.map(idea => {
          const statusDisplay = getStatusDisplay(idea);
          return <div key={idea.id} className="p-6 bg-[#621fff]">
                  <div className="flex justify-between items-start mb-2">
                    <p className="flex-1 mr-4 text-zinc-950 text-center font-semibold text-2xl">
                      {idea.idea_text}
                    </p>
                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusDisplay.color}`}>
                        {statusDisplay.icon}
                        {statusDisplay.text}
                      </span>
                      
                      {/* Preview Button */}
                      {idea.approval_status === 'preview_ready' && idea.preview_video_url && <Button size="sm" onClick={() => setSelectedVideoForPreview(idea)} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Eye className="w-3 h-3 mr-1" />
                          Review
                        </Button>}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {idea.selected_platforms.map(platform => <span key={platform} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {platform}
                      </span>)}
                  </div>
                  
                  {/* Rejection Reason */}
                  {idea.approval_status === 'rejected' && idea.rejected_reason && <div className="mb-2">
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                        <strong className="text-xs text-black ">Rejection reason:</strong> {idea.rejected_reason}
                      </p>
                    </div>}

                  {/* Video file link */}
                  {idea.video_url && <div className="mb-2">
                      <a href={idea.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm">
                        <ExternalLink className="h-3 w-3" />
                        View Video File
                      </a>
                    </div>}

                  {/* Platform links */}
                  {getPlatformLinks(idea).length > 0 && <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">Platform Links:</p>
                      <div className="flex flex-wrap gap-2">
                        {getPlatformLinks(idea).map(link => <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded">
                            <ExternalLink className="h-3 w-3" />
                            {link.platform}
                          </a>)}
                      </div>
                    </div>}

                  <div className="text-xs text-black ">
                    {new Date(idea.created_at).toLocaleDateString()}
                  </div>
                </div>;
        })}
        </div>
      </div>

      {/* Video Preview Modal */}
      {selectedVideoForPreview && <VideoPreviewModal isOpen={!!selectedVideoForPreview} onClose={() => setSelectedVideoForPreview(null)} videoIdea={selectedVideoForPreview} onApprovalChange={fetchVideoIdeas} />}
    </>;
};