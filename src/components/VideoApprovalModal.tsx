
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, PlayCircle } from "lucide-react";

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

interface VideoApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: PendingVideo;
  onApprovalChange: () => void;
}

export const VideoApprovalModal = ({ 
  isOpen, 
  onClose, 
  video, 
  onApprovalChange 
}: VideoApprovalModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      // Update the pending video status to approved
      const { error: updateError } = await supabase
        .from('pending_videos')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', video.id);

      if (updateError) throw updateError;

      // Call the handle-video-webhook edge function to trigger upload
      const { error: webhookError } = await supabase.functions.invoke('handle-video-webhook', {
        body: {
          phase: 'upload',
          execution_id: video.execution_id,
          video_url: video.video_url,
          upload_targets: video.upload_targets,
          titles_descriptions: video.titles_descriptions,
          approved: true
        }
      });

      if (webhookError) {
        console.warn('Webhook call failed, but approval was saved:', webhookError);
      }

      toast({
        title: "Video Approved!",
        description: "Your video is now being uploaded to your selected platforms.",
      });

      onApprovalChange();
      onClose();
    } catch (error) {
      console.error('Error approving video:', error);
      toast({
        title: "Error",
        description: "Failed to approve video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pending_videos')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason || "Not satisfied with the result"
        })
        .eq('id', video.id);

      if (error) throw error;

      // Notify about rejection via edge function
      const { error: webhookError } = await supabase.functions.invoke('handle-video-webhook', {
        body: {
          phase: 'upload',
          execution_id: video.execution_id,
          approved: false,
          rejection_reason: rejectionReason
        }
      });

      if (webhookError) {
        console.warn('Webhook notification failed:', webhookError);
      }

      toast({
        title: "Video Rejected",
        description: "The video has been rejected and will not be uploaded.",
      });

      onApprovalChange();
      onClose();
    } catch (error) {
      console.error('Error rejecting video:', error);
      toast({
        title: "Error",
        description: "Failed to reject video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setShowRejectionForm(false);
      setRejectionReason("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve Your Video</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Idea Display */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Video Idea:</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{video.idea}</p>
          </div>

          {/* Caption */}
          {video.caption && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Caption:</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{video.caption}</p>
            </div>
          )}

          {/* Selected Platforms */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Upload Targets:</h3>
            <div className="flex flex-wrap gap-2">
              {video.upload_targets.map((platform) => (
                <span key={platform} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm capitalize">
                  {platform}
                </span>
              ))}
            </div>
          </div>

          {/* Video Preview */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Video Preview:</h3>
            <div className="bg-black rounded-lg overflow-hidden relative">
              <video
                src={video.video_url}
                controls
                className="w-full max-h-96"
                poster="/placeholder.svg"
              >
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <PlayCircle className="w-16 h-16 text-white opacity-70" />
              </div>
            </div>
          </div>

          {/* Titles and Descriptions */}
          {video.titles_descriptions && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Platform-Specific Content:</h3>
              <div className="space-y-3">
                {Object.entries(video.titles_descriptions).map(([platform, content]: [string, any]) => (
                  <div key={platform} className="border rounded-lg p-3">
                    <h4 className="font-medium capitalize mb-2">{platform}:</h4>
                    {content.title && <p className="text-sm"><strong>Title:</strong> {content.title}</p>}
                    {content.description && <p className="text-sm"><strong>Description:</strong> {content.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showRejectionForm ? (
            <div className="flex gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectionForm(true)}
                disabled={isSubmitting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject
              </Button>
              
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1" />
                )}
                Approve & Upload
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Reason for rejection (optional):</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Why are you rejecting this video?"
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason("");
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  variant="destructive"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-1" />
                  )}
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
