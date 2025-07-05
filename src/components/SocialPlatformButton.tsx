
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
  onConnect,
}: SocialPlatformButtonProps) => {
  const isImageIcon = icon.startsWith('/lovable-uploads/') || icon.startsWith('http');

  return (
    <div className="relative">
      <Button
        onClick={onConnect}
        disabled={isConnected || isConnecting || isPremiumRequired}
        className={`w-full h-24 min-w-[140px] bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl ${isPremiumRequired ? 'opacity-60' : ''}`}
      >
        <div className="flex flex-col items-center justify-center space-y-2 w-full h-full p-2">
          {isConnecting && <Loader2 className="w-8 h-8 animate-spin text-blue-600" />}
          {!isConnecting && isImageIcon && (
            <img 
              src={icon} 
              alt={name} 
              className="w-12 h-12 object-contain"
            />
          )}
          {!isConnecting && !isImageIcon && (
            <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
              <span className="text-2xl">{icon === 'facebook' ? 'f' : icon === 'x' ? 'X' : 'in'}</span>
            </div>
          )}
          <span className="text-sm font-medium text-center">
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
          <div className="flex items-center space-x-1 bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
            <Lock className="w-3 h-3" />
            <span>Coming Soon</span>
          </div>
        </div>
      )}
      
      {isPremiumRequired && (
        <div className="absolute top-2 right-2">
          <div className="flex items-center space-x-1 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            <Lock className="w-3 h-3" />
            <span>Premium</span>
          </div>
        </div>
      )}
    </div>
  );
};
