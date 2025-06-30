
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, PlayCircle } from "lucide-react";
import { useSocialTokens } from "@/hooks/useSocialTokens";

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoIdea: {
    id: string;
    idea_text: string;
    preview_video_url?: string;
    video_url?: string;
    selected_platforms: string[];
    approval_status: string;
    caption?: string;
    youtube_title?: string;
    tiktok_title?: string;
    instagram_title?: string;
    environment_prompt?: string;
    sound_prompt?: string;
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
  const { connectedAccounts } = useSocialTokens();

  // Check if this is the new workflow (ready_for_approval) or old workflow (preview_ready)
  const isNewWorkflow = videoIdea.approval_status === 'ready_for_approval';
  const videoUrl = isNewWorkflow ? videoIdea.video_url : videoIdea.preview_video_url;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      if (isNewWorkflow) {
        // New workflow: Send social tokens to n8n
        const socialAccounts: Record<string, any> = {};
        
        // Build social accounts object with OAuth tokens
        videoIdea.selected_platforms.forEach(platform => {
          const token = connectedAccounts.find(t => t.platform === platform.toLowerCase());
          if (token) {
            socialAccounts[platform.toLowerCase()] = {
              access_token: token.access_token,
              refresh_token: token.refresh_token,
              expires_at: token.expires_at
            };
          }
        });

        console.log('Sending approval with social accounts:', socialAccounts);

        // Call the enhanced approval function
        const { error } = await supabase.functions.invoke('approve-video', {
          body: {
            video_idea_id: videoIdea.id,
            approved: true,
            social_accounts: socialAccounts,
            selected_platforms: videoIdea.selected_platforms
          }
        });

        if (error) throw error;

        toast({
          title: "Video Approved!",
          description: "Your video is now being published to your selected platforms.",
        });
      } else {
        // Old workflow
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
      }

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
          <DialogTitle>
            {isNewWorkflow ? "Publish Your Video" : "Preview Your Video"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Idea Display */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Video Idea:</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{videoIdea.idea_text}</p>
          </div>

          {/* Caption */}
          {videoIdea.caption && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Caption:</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{videoIdea.caption}</p>
            </div>
          )}

          {/* Platform-specific titles */}
          {isNewWorkflow && (videoIdea.youtube_title || videoIdea.tiktok_title || videoIdea.instagram_title) && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Platform Titles:</h3>
              <div className="space-y-2">
                {videoIdea.youtube_title && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <strong className="text-red-700">YouTube:</strong> {videoIdea.youtube_title}
                  </div>
                )}
                {videoIdea.tiktok_title && (
                  <div className="bg-black p-3 rounded-lg">
                    <strong className="text-white">TikTok:</strong> <span className="text-white">{videoIdea.tiktok_title}</span>
                  </div>
                )}
                {videoIdea.instagram_title && (
                  <div className="bg-pink-50 p-3 rounded-lg">
                    <strong className="text-pink-700">Instagram:</strong> {videoIdea.instagram_title}
                  </div>
                )}
              </div>
            </div>
          )}

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
          {videoUrl && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Video Preview:</h3>
              <div className="bg-black rounded-lg overflow-hidden relative">
                <video
                  src={videoUrl}
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
          )}

          {/* Environment and Sound Prompts */}
          {isNewWorkflow && (videoIdea.environment_prompt || videoIdea.sound_prompt) && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Generation Details:</h3>
              <div className="space-y-2">
                {videoIdea.environment_prompt && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <strong className="text-blue-700">Environment:</strong> {videoIdea.environment_prompt}
                  </div>
                )}
                {videoIdea.sound_prompt && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <strong className="text-green-700">Sound:</strong> {videoIdea.sound_prompt}
                  </div>
                )}
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
                {isNewWorkflow ? 'Approve & Publish' : 'Approve & Publish'}
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
