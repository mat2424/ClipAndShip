
import { useState } from "react";
import { SocialPlatformButton } from "./SocialPlatformButton";
import { ConnectedAccountCard } from "./ConnectedAccountCard";
import { useSocialTokens } from "@/hooks/useSocialTokens";
import { initiateOAuth } from "@/utils/oauthUtils";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

type SocialPlatform = Database["public"]["Enums"]["social_platform"];

const platforms: { platform: SocialPlatform; name: string; color: string; icon: string; locked?: boolean; customFlow?: boolean }[] = [
  { platform: "youtube", name: "YouTube", color: "bg-red-600 hover:bg-red-700", icon: "/lovable-uploads/cd7cb743-01ad-4a0d-a56b-f5e956d0f595.png" },
  { platform: "tiktok", name: "TikTok", color: "bg-black hover:bg-gray-800", icon: "/lovable-uploads/bab6eff1-1fa1-4a04-b442-3d1c40472cef.png", customFlow: true },
  { platform: "instagram", name: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600", icon: "/lovable-uploads/ddef2800-d5db-4e6d-8e87-e8d228c761a1.png", customFlow: true },
  { platform: "facebook", name: "Facebook", color: "bg-blue-600 hover:bg-blue-700", icon: "/lovable-uploads/60a3a2a1-4e39-46b3-8d72-382997a7b692.png", locked: true },
  { platform: "x", name: "X (Twitter)", color: "bg-gray-900 hover:bg-black", icon: "/lovable-uploads/e602472a-fd56-45af-9504-e325e09c74f3.png", locked: true },
  { platform: "linkedin", name: "LinkedIn", color: "bg-blue-700 hover:bg-blue-800", icon: "/lovable-uploads/34be507c-e645-4c1e-bbb1-b9a922babca0.png", locked: true },
];

export const SocialAccountsManager = () => {
  const { connectedAccounts, loading, refreshAccounts, disconnectAccount } = useSocialTokens();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConnect = async (platform: SocialPlatform) => {
    const platformConfig = platforms.find(p => p.platform === platform);
    
    if (platformConfig?.locked) {
      toast({
        title: "Coming Soon",
        description: `${platformConfig.name} integration is coming soon! Stay tuned for updates.`,
        variant: "default",
      });
      return;
    }

    setIsConnecting(platform);
    
    try {
      await initiateOAuth(platform);
      
      toast({
        title: "Connecting...",
        description: `Redirecting to ${platformConfig?.name} for authorization...`,
      });
      
    } catch (error) {
      console.error(`Error connecting to ${platform}:`, error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : `Failed to connect to ${platform}. Please try again.`,
        variant: "destructive",
      });
      setIsConnecting(null);
    }
  };

  const isConnected = (platform: SocialPlatform) => {
    return connectedAccounts.some(account => account.platform === platform);
  };

  return (
    <div className="space-y-6">
      {/* Back to Main Page Button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Main Page</span>
        </Link>
      </div>

      {/* Available Platforms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platformConfig) => (
          <SocialPlatformButton
            key={platformConfig.platform}
            platform={platformConfig.platform}
            name={platformConfig.name}
            color={platformConfig.color}
            icon={platformConfig.icon}
            isConnected={isConnected(platformConfig.platform)}
            isConnecting={isConnecting === platformConfig.platform}
            isLocked={platformConfig.locked}
            onConnect={() => handleConnect(platformConfig.platform)}
          />
        ))}
      </div>

      {/* Connected Accounts */}
      {connectedAccounts.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Connected Accounts</h3>
          <div className="space-y-3">
            {connectedAccounts.map((account) => {
              const platformConfig = platforms.find(p => p.platform === account.platform);
              return (
                <ConnectedAccountCard
                  key={account.id}
                  account={account}
                  platformName={platformConfig?.name || account.platform}
                  onDisconnect={() => disconnectAccount(account.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {connectedAccounts.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No accounts connected yet. Start by connecting your first social media account above.</p>
        </div>
      )}
    </div>
  );
};
