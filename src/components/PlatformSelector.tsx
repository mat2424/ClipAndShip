import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const PLATFORMS = [{
  name: "YouTube",
  tier: "free"
}, {
  name: "TikTok",
  tier: "free"
}, {
  name: "Instagram",
  tier: "free"
}, {
  name: "Facebook",
  tier: "premium"
}, {
  name: "X",
  tier: "premium"
}, {
  name: "LinkedIn",
  tier: "premium"
}];
interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformChange: (platforms: string[]) => void;
  userTier: string;
}
export const PlatformSelector = ({
  selectedPlatforms,
  onPlatformChange,
  userTier
}: PlatformSelectorProps) => {
  const {
    toast
  } = useToast();
  const canSelectPlatform = (platform: {
    name: string;
    tier: string;
  }) => {
    if (platform.tier === "free") return true;
    return userTier === "premium" || userTier === "pro";
  };
  const handlePlatformChange = (platform: string, checked: boolean) => {
    const platformData = PLATFORMS.find(p => p.name === platform);
    if (checked && platformData && !canSelectPlatform(platformData)) {
      toast({
        title: "Premium Feature",
        description: `${platform} is available for premium users only. Upgrade your account to access this platform.`,
        variant: "destructive"
      });
      return;
    }
    if (checked) {
      onPlatformChange([...selectedPlatforms, platform]);
    } else {
      onPlatformChange(selectedPlatforms.filter(p => p !== platform));
    }
  };
  return <div>
      <Label>Select Platforms *</Label>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {PLATFORMS.map(platform => {
        const isLocked = !canSelectPlatform(platform);
        return <div key={platform.name} className="flex items-center space-x-2">
              <Checkbox id={platform.name} checked={selectedPlatforms.includes(platform.name)} onCheckedChange={checked => handlePlatformChange(platform.name, checked as boolean)} disabled={isLocked} />
              <Label htmlFor={platform.name} className={`flex items-center space-x-1 ${isLocked ? 'text-gray-400' : ''}`}>
                <span className="text-white text-lg">{platform.name}</span>
                {isLocked && <Lock className="h-3 w-3" />}
              </Label>
              {isLocked && <span className="text-xs text-orange-600 font-medium">Premium</span>}
            </div>;
      })}
      </div>
      {userTier === 'free' && <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Upgrade to Premium</strong> to unlock Facebook, X, and LinkedIn platforms for wider reach!
          </p>
        </div>}
    </div>;
};