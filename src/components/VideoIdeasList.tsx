import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface VideoIdea {
  id: string;
  idea_text: string;
  selected_platforms: string[];
  status: string;
  video_url: string | null;
  youtube_link: string | null;
  instagram_link: string | null;
  tiktok_link: string | null;
  created_at: string;
}

export const VideoIdeasList = () => {
  const [videoIdeas, setVideoIdeas] = useState<VideoIdea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideoIdeas();

    // Subscribe to video ideas changes
    const channel = supabase
      .channel('video-ideas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_ideas'
        },
        () => fetchVideoIdeas()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVideoIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('video_ideas')
        .select('id, idea_text, selected_platforms, status, video_url, youtube_link, instagram_link, tiktok_link, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideoIdeas(data || []);
    } catch (error) {
      console.error('Error fetching video ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformLinks = (idea: VideoIdea) => {
    const links = [];
    if (idea.youtube_link) links.push({ platform: 'YouTube', url: idea.youtube_link });
    if (idea.instagram_link) links.push({ platform: 'Instagram', url: idea.instagram_link });
    if (idea.tiktok_link) links.push({ platform: 'TikTok', url: idea.tiktok_link });
    return links;
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Your Videos</h2>
      </div>
      <div className="divide-y">
        {videoIdeas.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No videos yet. Create your first video above!
          </div>
        ) : (
          videoIdeas.map((idea) => (
            <div key={idea.id} className="p-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-gray-600 flex-1 mr-4">
                  {idea.idea_text}
                </p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(idea.status)}`}>
                  {idea.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {idea.selected_platforms.map((platform) => (
                  <span key={platform} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {platform}
                  </span>
                ))}
              </div>
              
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

              <div className="text-xs text-gray-500">
                {new Date(idea.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
