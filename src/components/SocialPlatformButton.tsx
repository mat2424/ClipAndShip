import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
type SocialPlatform = Database["public"]["Enums"]["social_platform"];
interface SocialPlatformButtonProps {
  platform: SocialPlatform;
  name: string;
  color: string;
  icon: string;
  isConnected: boolean;
  isConnecting: boolean;
  isLocked?: boolean;
  isPremiumRequired?: boolean;
  onConnect: () => void;
}
export const SocialPlatformButton = ({
  platform,
  name,
  color,
  icon,
  isConnected,
  isConnecting,
  isLocked,
  isPremiumRequired,
  onConnect
}: SocialPlatformButtonProps) => {
  const isImageIcon = icon.startsWith('/lovable-uploads/') || icon.startsWith('http');
  
  // Determine badge type and styling
  const getBadgeConfig = () => {
    if (isLocked) {
      return { show: true, text: "Coming Soon", bgColor: "bg-muted", textColor: "text-muted-foreground" };
    }
    if (isPremiumRequired) {
      // Check if it's pro tier (based on platform)
      const proTierPlatforms = ['x', 'tiktok', 'linkedin'];
      const isPro = proTierPlatforms.includes(platform);
      return {
        show: true,
        text: isPro ? "Pro" : "Premium",
        bgColor: isPro ? "bg-purple-600" : "bg-blue-600",
        textColor: "text-white"
      };
    }
    return { show: false };
  };

  const badgeConfig = getBadgeConfig();

  return (
    <div className="relative w-full">
      <Button 
        onClick={onConnect} 
        disabled={isConnected || isConnecting || isPremiumRequired || isLocked}
        variant="outline"
        className="w-full h-20 bg-card hover:bg-accent border-border hover:border-accent-foreground/20 transition-all duration-200 p-3"
      >
        <div className="flex flex-col items-center justify-center space-y-2 w-full h-full">
          {/* Icon Section */}
          <div className="flex-shrink-0">
            {isConnecting ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : isImageIcon ? (
              <img src={icon} alt={name} className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 flex items-center justify-center bg-muted rounded-full">
                <span className="text-lg font-bold text-muted-foreground">
                  {icon === 'facebook' ? 'f' : icon === 'x' ? 'X' : 'in'}
                </span>
              </div>
            )}
          </div>
          
          {/* Text Section */}
          <div className="text-center min-h-[2rem] flex items-center">
            <span className="text-xs font-medium text-foreground leading-tight">
              {isConnected ? `✓ ${name}` : isConnecting ? "Connecting..." : name}
            </span>
          </div>
        </div>
      </Button>
      
      {/* Badge - Clean positioning */}
      {badgeConfig.show && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className={`flex items-center space-x-1 ${badgeConfig.bgColor} ${badgeConfig.textColor} text-xs px-2 py-1 rounded-full font-medium shadow-md`}>
            {isLocked && <Lock className="w-3 h-3" />}
            <span>{badgeConfig.text}</span>
          </div>
        </div>
      )}
    </div>
  );
};