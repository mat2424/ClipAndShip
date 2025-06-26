
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

interface VoiceSettingsProps {
  useCustomVoice: boolean;
  onUseCustomVoiceChange: (useCustom: boolean) => void;
  onVoiceFileChange: (file: File | null) => void;
  userTier: string;
}

export const VoiceSettings = ({ 
  useCustomVoice, 
  onUseCustomVoiceChange, 
  onVoiceFileChange,
  userTier 
}: VoiceSettingsProps) => {
  const isProUser = userTier === 'pro';

  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="custom-voice"
          checked={useCustomVoice}
          onCheckedChange={(checked) => isProUser && onUseCustomVoiceChange(checked as boolean)}
          disabled={!isProUser}
        />
        <Label htmlFor="custom-voice" className="flex items-center space-x-2">
          <span>Use Custom Voice</span>
          {!isProUser && <Lock className="w-4 h-4 text-gray-400" />}
        </Label>
        {!isProUser && (
          <span className="text-sm text-blue-600 hover:underline cursor-pointer">
            Upgrade to Pro
          </span>
        )}
      </div>

      {!isProUser && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Free Plan:</strong> AI voice generation included. 
            Upgrade to Pro to upload your own custom voice files.
          </p>
        </div>
      )}

      {isProUser && useCustomVoice && (
        <div>
          <Label htmlFor="voice-file">Upload Voice File</Label>
          <Input
            id="voice-file"
            type="file"
            accept="audio/*"
            onChange={(e) => onVoiceFileChange(e.target.files?.[0] || null)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Upload an audio file to clone your voice
          </p>
        </div>
      )}
    </>
  );
};
