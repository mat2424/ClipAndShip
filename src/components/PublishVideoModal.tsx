import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useSocialTokens } from "@/hooks/useSocialTokens";

type SocialPlatform = Database["public"]["Enums"]["social_platform"];

interface PublishVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoIdea: {
    id: string;
    idea_text: string;
    video_url?: string;
    caption?: string;
  };
}

const PLATFORM_CONFIG = [
  { platform: "youtube", name: "YouTube", tier: "free", icon: "/lovable-uploads/cd7cb743-01ad-4a0d-a56b-f5e956d0f595.png" },
  { platform: "instagram", name: "Instagram", tier: "premium", icon: "/lovable-uploads/ddef2800-d5db-4e6d-8e87-e8d228c761a1.png" },
  { platform: "facebook", name: "Facebook", tier: "premium", icon: "/lovable-uploads/60a3a2a1-4e39-46b3-8d72-382997a7b692.png" },
  { platform: "threads", name: "Threads", tier: "premium", icon: "/lovable-uploads/6d56ef0c-fbdd-4dd5-926d-5913714d348a.png" },
  { platform: "x", name: "X (Twitter)", tier: "pro", icon: "/lovable-uploads/e602472a-fd56-45af-9504-e325e09c74f3.png" },
  { platform: "linkedin", name: "LinkedIn", tier: "pro", icon: "/lovable-uploads/34be507c-e645-4c1e-bbb1-b9a922babca0.png" },
  { platform: "tiktok", name: "TikTok", tier: "pro", icon: "/lovable-uploads/bab6eff1-1fa1-4a04-b442-3d1c40472cef.png" },
];

export const PublishVideoModal = ({ isOpen, onClose, videoIdea }: PublishVideoModalProps) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [userTier, setUserTier] = useState<string>('free');
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const { connectedAccounts } = useSocialTokens();

  useEffect(() => {
    fetchUserTier();
  }, []);

  const fetchUserTier = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserTier(profile.subscription_tier);
      }
    } catch (error) {
      console.error('Error fetching user tier:', error);
    }
  };

  const canSelectPlatform = (platform: { platform: string; tier: string }) => {
    if (platform.tier === "free") return true;
    if (platform.tier === "premium") return userTier === "premium" || userTier === "pro";
    if (platform.tier === "pro") return userTier === "pro";
    return false;
  };

  const isConnected = (platform: string) => {
    return connectedAccounts.some(account => account.platform === platform);
  };

  const getAvailablePlatforms = () => {
    return PLATFORM_CONFIG.filter(platform => canSelectPlatform(platform));
  };

  const handlePlatformToggle = (platform: string, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms(prev => [...prev, platform]);
    } else {
      setSelectedPlatforms(prev => prev.filter(p => p !== platform));
    }
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please select at least one platform to publish to.",
        variant: "destructive",
      });
      return;
    }

    // Check if all selected platforms are connected
    const unconnectedPlatforms = selectedPlatforms.filter(platform => !isConnected(platform));
    if (unconnectedPlatforms.length > 0) {
      toast({
        title: "Missing Connections",
        description: `Please connect your ${unconnectedPlatforms.join(', ')} account(s) before publishing.`,
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      // Build social accounts payload
      const socialAccounts: Record<string, any> = {};
      selectedPlatforms.forEach(platform => {
        const token = connectedAccounts.find(t => t.platform === platform);
        if (token) {
          socialAccounts[platform] = {
            access_token: token.access_token,
            refresh_token: token.refresh_token,
            expires_at: token.expires_at
          };
        }
      });

      // Call the approve-video function to publish
      const { error } = await supabase.functions.invoke('approve-video', {
        body: {
          video_idea_id: videoIdea.id,
          approved: true,
          social_accounts: socialAccounts,
          selected_platforms: selectedPlatforms
        }
      });

      if (error) throw error;

      toast({
        title: "Publishing Started!",
        description: "Your video is being published to the selected platforms.",
      });

      onClose();
    } catch (error) {
      console.error('Error publishing video:', error);
      toast({
        title: "Publishing Failed",
        description: "Failed to publish video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish Video</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Info */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Video:</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{videoIdea.idea_text}</p>
          </div>

          {/* Platform Selection */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Select Platforms to Publish To:</h3>
            <div className="grid grid-cols-2 gap-4">
              {getAvailablePlatforms().map((platform) => {
                const connected = isConnected(platform.platform);
                const disabled = !connected;
                
                return (
                  <div key={platform.platform} className={`border rounded-lg p-4 ${disabled ? 'opacity-50' : ''}`}>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={platform.platform}
                        checked={selectedPlatforms.includes(platform.platform)}
                        onCheckedChange={(checked) => handlePlatformToggle(platform.platform, checked as boolean)}
                        disabled={disabled}
                      />
                      <img src={platform.icon} alt={platform.name} className="w-8 h-8 object-contain" />
                      <div className="flex-1">
                        <Label htmlFor={platform.platform} className={`font-medium ${disabled ? 'text-gray-400' : ''}`}>
                          {platform.name}
                        </Label>
                        {!connected && (
                          <p className="text-xs text-red-500">Not connected</p>
                        )}
                        {connected && (
                          <p className="text-xs text-green-600">✓ Connected</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tier Info */}
          {userTier === 'free' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600">
                <strong>Upgrade to Premium</strong> to unlock Instagram, Facebook, and Threads platforms!<br/>
                <strong>Upgrade to Pro</strong> to unlock X, TikTok, and LinkedIn platforms!
              </p>
            </div>
          )}
          {userTier === 'premium' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-600">
                <strong>Upgrade to Pro</strong> to unlock X, TikTok, and LinkedIn platforms!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isPublishing}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing || selectedPlatforms.length === 0}>
              {isPublishing ? "Publishing..." : `Publish to ${selectedPlatforms.length} Platform${selectedPlatforms.length === 1 ? '' : 's'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};