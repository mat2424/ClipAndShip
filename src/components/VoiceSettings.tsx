
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VoiceSettingsProps {
  useAiVoice: boolean;
  onUseAiVoiceChange: (useAi: boolean) => void;
  onVoiceFileChange: (file: File | null) => void;
}

export const VoiceSettings = ({ 
  useAiVoice, 
  onUseAiVoiceChange, 
  onVoiceFileChange 
}: VoiceSettingsProps) => {
  return (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ai-voice"
          checked={useAiVoice}
          onCheckedChange={(checked) => onUseAiVoiceChange(checked as boolean)}
        />
        <Label htmlFor="ai-voice">Use AI Voice</Label>
      </div>

      {!useAiVoice && (
        <div>
          <Label htmlFor="voice-file">Upload Voice File</Label>
          <Input
            id="voice-file"
            type="file"
            accept="audio/*"
            onChange={(e) => onVoiceFileChange(e.target.files?.[0] || null)}
          />
        </div>
      )}
    </>
  );
};
