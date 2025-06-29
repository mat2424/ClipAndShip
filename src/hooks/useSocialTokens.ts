
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type SocialToken = Database["public"]["Tables"]["social_tokens"]["Row"];

export const useSocialTokens = () => {
  const [connectedAccounts, setConnectedAccounts] = useState<SocialToken[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConnectedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('social_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching social tokens:', error);
        toast({
          title: "Error",
          description: "Failed to fetch connected accounts.",
          variant: "destructive",
        });
      } else {
        // Validate tokens and check if they need refresh
        const validatedAccounts = await Promise.all(
          (data || []).map(async (account) => {
            if (account.platform === 'youtube') {
              // Check if YouTube token is still valid
              const isValid = await validateYouTubeToken(account.access_token);
              if (!isValid && account.refresh_token) {
                // Try to refresh the token
                const refreshed = await refreshYouTubeToken(account);
                if (refreshed) {
                  return refreshed;
                }
              }
            }
            return account;
          })
        );
        setConnectedAccounts(validatedAccounts.filter(Boolean) as SocialToken[]);
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateYouTubeToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error validating YouTube token:', error);
      return false;
    }
  };

  const refreshYouTubeToken = async (account: SocialToken): Promise<SocialToken | null> => {
    try {
      // Note: In a real implementation, you'd need to handle OAuth refresh flow
      // For now, we'll return null to indicate the token needs re-authentication
      console.log('YouTube token needs refresh for account:', account.id);
      return null;
    } catch (error) {
      console.error('Error refreshing YouTube token:', error);
      return null;
    }
  };

  const disconnectAccount = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('social_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) {
        console.error('Error disconnecting account:', error);
        toast({
          title: "Error",
          description: "Failed to disconnect account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account disconnected successfully.",
        });
        fetchConnectedAccounts();
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect account.",
        variant: "destructive",
      });
    }
  };

  const getValidToken = async (platform: string): Promise<string | null> => {
    const account = connectedAccounts.find(acc => acc.platform === platform);
    if (!account) return null;

    if (platform === 'youtube') {
      const isValid = await validateYouTubeToken(account.access_token);
      if (isValid) {
        return account.access_token;
      }
      
      // Token is invalid, user needs to reconnect
      toast({
        title: "Token Expired",
        description: "Your YouTube connection has expired. Please reconnect your account.",
        variant: "destructive",
      });
      return null;
    }

    return account.access_token;
  };

  const refreshAccounts = () => {
    fetchConnectedAccounts();
  };

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  return {
    connectedAccounts,
    loading,
    refreshAccounts,
    disconnectAccount,
    getValidToken,
  };
};
