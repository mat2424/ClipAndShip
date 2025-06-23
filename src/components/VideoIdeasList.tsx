
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VideoIdea {
  id: string;
  idea_text: string;
  selected_platforms: string[];
  status: string;
  video_url: string | null;
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
        .select('*')
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
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                {idea.video_url && (
                  <a
                    href={idea.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Video
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
