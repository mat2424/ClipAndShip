
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
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUserEmail();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-gray-800/50 border border-pink-500/30 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <h4 className="font-semibold text-white">{platformName}</h4>
          <div className="flex items-center space-x-4 text-sm text-pink-200">
            <span>{userEmail}</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Connected {formatDate(account.created_at)}</span>
            </span>
          </div>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onDisconnect}
        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-500/50 hover:border-red-400"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Disconnect
      </Button>
    </div>
  );
};
