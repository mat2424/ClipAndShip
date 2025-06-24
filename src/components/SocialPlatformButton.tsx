
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
  onConnect,
}: SocialPlatformButtonProps) => {
  return (
    <div className="relative">
      <Button
        onClick={onConnect}
        disabled={isConnected || isConnecting}
        className={`w-full h-16 ${color} text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
      >
        <div className="flex items-center justify-center space-x-3">
          {isConnecting && <Loader2 className="w-5 h-5 animate-spin" />}
          {isLocked && !isConnecting && <Lock className="w-5 h-5" />}
          <span>
            {isConnected 
              ? `✓ ${name} Connected` 
              : isConnecting 
                ? `Connecting...` 
                : `Connect ${name}`
            }
          </span>
        </div>
      </Button>
      
      {isLocked && (
        <div className="absolute top-2 right-2">
          <span className="bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
            Coming Soon
          </span>
        </div>
      )}
    </div>
  );
};
