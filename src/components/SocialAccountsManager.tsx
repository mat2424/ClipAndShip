
import { useState, useEffect } from "react";
import { SocialPlatformButton } from "./SocialPlatformButton";
import { ConnectedAccountCard } from "./ConnectedAccountCard";
import { useSocialTokens } from "@/hooks/useSocialTokens";
import { Database } from "@/integrations/supabase/types";

type SocialPlatform = Database["public"]["Enums"]["social_platform"];

const platforms: { platform: SocialPlatform; name: string; color: string; icon: string; locked?: boolean }[] = [
  { platform: "youtube", name: "YouTube", color: "bg-red-600 hover:bg-red-700", icon: "youtube" },
  { platform: "tiktok", name: "TikTok", color: "bg-black hover:bg-gray-800", icon: "music" },
  { platform: "instagram", name: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600", icon: "instagram" },
  { platform: "facebook", name: "Facebook", color: "bg-blue-600 hover:bg-blue-700", icon: "facebook", locked: true },
  { platform: "x", name: "X (Twitter)", color: "bg-gray-900 hover:bg-black", icon: "x", locked: true },
  { platform: "linkedin", name: "LinkedIn", color: "bg-blue-700 hover:bg-blue-800", icon: "linkedin", locked: true },
];

export const SocialAccountsManager = () => {
  const { connectedAccounts, loading, refreshAccounts, disconnectAccount } = useSocialTokens();
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = async (platform: SocialPlatform) => {
    if (platforms.find(p => p.platform === platform)?.locked) {
      alert("This platform is coming soon! Stay tuned for updates.");
      return;
    }

    setIsConnecting(platform);
    
    // This will be replaced with actual OAuth URLs later
    // For now, we'll simulate the connection process
    setTimeout(() => {
      alert(`OAuth flow for ${platform} would start here. You'll add the actual OAuth URLs later.`);
      setIsConnecting(null);
    }, 1000);
  };

  const isConnected = (platform: SocialPlatform) => {
    return connectedAccounts.some(account => account.platform === platform);
  };

  return (
    <div className="space-y-6">
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
