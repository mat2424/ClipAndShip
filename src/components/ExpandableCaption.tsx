import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExpandableCaptionProps {
  caption: string | null;
  videoId: string;
  onUpdate?: (newCaption: string) => void;
}

export const ExpandableCaption = ({ caption, videoId, onUpdate }: ExpandableCaptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(caption || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('video_ideas')
        .update({ caption: editedCaption })
        .eq('id', videoId);

      if (error) throw error;

      onUpdate?.(editedCaption);
      setIsEditing(false);
      toast({
        title: "Caption Updated",
        description: "Your video caption has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating caption:', error);
      toast({
        title: "Error",
        description: "Failed to update caption. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditedCaption(caption || "");
    setIsEditing(false);
  };

  if (!caption) return null;

  const displayCaption = caption.length > 100 && !isExpanded 
    ? `${caption.substring(0, 100)}...` 
    : caption;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          {isEditing ? (
            <Textarea
              value={editedCaption}
              onChange={(e) => setEditedCaption(e.target.value)}
              className="min-h-[100px] resize-none"
              placeholder="Enter video caption..."
            />
          ) : (
            <p className="text-sm text-black whitespace-pre-wrap">
              {displayCaption}
            </p>
          )}
        </div>
        
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isUpdating}
          >
            <Check className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      )}

      {!isEditing && caption.length > 100 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 text-xs text-black"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show More
            </>
          )}
        </Button>
      )}
    </div>
  );
};