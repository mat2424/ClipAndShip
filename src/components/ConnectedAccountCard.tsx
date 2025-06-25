
import { AlertCircle, Calendar, Trash2 } from "lucide-react";
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

  const isExpiringSoon = account.expires_at 
    ? new Date(account.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : false;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{platformName}</h4>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{userEmail}</span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Connected {formatDate(account.created_at)}</span>
            </span>
            {account.expires_at && (
              <span className={`flex items-center space-x-1 ${isExpiringSoon ? 'text-yellow-600' : ''}`}>
                {isExpiringSoon && <AlertCircle className="w-4 h-4" />}
                <span>Expires {formatDate(account.expires_at)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onDisconnect}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Disconnect
      </Button>
    </div>
  );
};
