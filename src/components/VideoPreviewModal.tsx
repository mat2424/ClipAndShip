
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoIdea: {
    id: string;
    idea_text: string;
    preview_video_url: string;
    selected_platforms: string[];
    approval_status: string;
  };
  onApprovalChange: () => void;
}

export const VideoPreviewModal = ({ 
  isOpen, 
  onClose, 
  videoIdea, 
  onApprovalChange 
}: VideoPreviewModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('approve-video', {
        body: {
          video_idea_id: videoIdea.id,
          approved: true
        }
      });

      if (error) throw error;

      toast({
        title: "Video Approved!",
        description: "Your video is now being published to your selected platforms.",
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
      const { error } = await supabase.functions.invoke('approve-video', {
        body: {
          video_idea_id: videoIdea.id,
          approved: false,
          rejection_reason: rejectionReason || "Not satisfied with the result"
        }
      });

      if (error) throw error;

      toast({
        title: "Video Rejected",
        description: "The video has been rejected and will not be published.",
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
          <DialogTitle>Preview Your Video</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Idea Display */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Video Idea:</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{videoIdea.idea_text}</p>
          </div>

          {/* Selected Platforms */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Selected Platforms:</h3>
            <div className="flex flex-wrap gap-2">
              {videoIdea.selected_platforms.map((platform) => (
                <span key={platform} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {platform}
                </span>
              ))}
            </div>
          </div>

          {/* Video Preview */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Video Preview:</h3>
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                src={videoIdea.preview_video_url}
                controls
                className="w-full max-h-96"
                poster="/placeholder.svg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

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
                Approve & Publish
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
