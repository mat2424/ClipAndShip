
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface VideoPreviewCardProps {
  video: PendingVideo;
  onPreview: (video: PendingVideo) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending_approval':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'uploading':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending_approval':
      return <Clock className="w-4 h-4" />;
    case 'approved':
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'rejected':
      return <XCircle className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

export const VideoPreviewCard = ({ video, onPreview }: VideoPreviewCardProps) => {
  const [thumbnailError, setThumbnailError] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{video.idea}</CardTitle>
          <Badge className={`ml-2 flex items-center gap-1 ${getStatusColor(video.status)}`}>
            {getStatusIcon(video.status)}
            {video.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Video Thumbnail */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {!thumbnailError ? (
            <video
              src={video.video_url}
              className="w-full h-full object-cover"
              onError={() => setThumbnailError(true)}
              muted
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <PlayCircle className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <PlayCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Upload Targets */}
        <div className="flex flex-wrap gap-1">
          {video.upload_targets.map((platform) => (
            <Badge key={platform} variant="outline" className="text-xs capitalize">
              {platform}
            </Badge>
          ))}
        </div>

        {/* Caption Preview */}
        {video.caption && (
          <p className="text-sm text-gray-600 line-clamp-2">{video.caption}</p>
        )}

        {/* Metadata */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>
            Created {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onPreview(video)}
            className="flex-1"
            variant={video.status === 'pending_approval' ? 'default' : 'outline'}
          >
            <PlayCircle className="w-4 h-4 mr-1" />
            {video.status === 'pending_approval' ? 'Review & Approve' : 'View Details'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
