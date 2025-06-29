import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VideoPreviewCard } from "@/components/VideoPreviewCard";
import { VideoApprovalModal } from "@/components/VideoApprovalModal";
import { Loader2, Video } from "lucide-react";

interface PendingVideo {
  id: string;
  execution_id: string;
  video_url: string;
  idea: string;
  caption: string;
  titles_descriptions: any;
  upload_targets: string[];
  status: string;
  created_at: string;
}

export const PendingVideosPage = () => {
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<PendingVideo | null>(null);
  const { toast } = useToast();

  const fetchPendingVideos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('pending_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending videos:', error);
        toast({
          title: "Error",
          description: "Failed to fetch pending videos.",
          variant: "destructive",
        });
      } else {
        setPendingVideos(data || []);
      }
    } catch (error) {
      console.error('Error fetching pending videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVideos();

    // Subscribe to pending videos changes for real-time updates
    const channel = supabase.channel('pending-videos-changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'pending_videos'
    }, () => fetchPendingVideos()).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprovalChange = () => {
    fetchPendingVideos();
    setSelectedVideo(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your videos...</p>
        </div>
      </div>
    );
  }

  const pendingApprovalVideos = pendingVideos.filter(v => v.status === 'pending_approval');
  const otherVideos = pendingVideos.filter(v => v.status !== 'pending_approval');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Approvals</h1>
        <p className="text-gray-600">Review and approve your generated videos before they're uploaded to social media.</p>
      </div>

      {/* Pending Approval Section */}
      {pendingApprovalVideos.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
            <Video className="w-6 h-6 mr-2 text-yellow-600" />
            Awaiting Your Approval ({pendingApprovalVideos.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingApprovalVideos.map((video) => (
              <VideoPreviewCard
                key={video.id}
                video={video}
                onPreview={setSelectedVideo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Videos Section */}
      {otherVideos.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherVideos.map((video) => (
              <VideoPreviewCard
                key={video.id}
                video={video}
                onPreview={setSelectedVideo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingVideos.length === 0 && (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No videos yet</h3>
          <p className="text-gray-600 mb-6">
            Generated videos will appear here for your review and approval.
          </p>
        </div>
      )}

      {/* Video Approval Modal */}
      {selectedVideo && (
        <VideoApprovalModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          video={selectedVideo}
          onApprovalChange={handleApprovalChange}
        />
      )}
    </div>
  );
};

export default PendingVideosPage;
