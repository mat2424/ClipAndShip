
import { Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Database } from "@/integrations/supabase/types";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type SocialToken = Database["public"]["Tables"]["social_tokens"]["Row"];

interface ConnectedAccountCardProps {
  account: SocialToken;
  platformName: string;
  onDisconnect: () => void;
}

export const ConnectedAccountCard = ({
  account,
  platformName,
  onDisconnect,
}: ConnectedAccountCardProps) => {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-cool-navy/50 border border-cool-turquoise/30 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-lg mb-2">{platformName}</h4>
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-cool-light">
            <span className="truncate">{account.username || `${platformName} Account`}</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>Connected {formatDate(account.created_at)}</span>
            </span>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onDisconnect}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-500/50 hover:border-red-400 w-full sm:w-auto flex-shrink-0"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    </div>
  );
};
