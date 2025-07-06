
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
        console.log('📊 Fetched social tokens:', data?.length || 0);
        
        // Clean up expired tokens and validate remaining ones
        const validatedAccounts = await Promise.all(
          (data || []).map(async (account) => {
            // Check if token is expired based on expires_at
            if (account.expires_at && new Date(account.expires_at) <= new Date()) {
              console.log(`⏰ Token expired for ${account.platform}, attempting refresh...`);
              if (account.platform === 'youtube') {
                const refreshed = await refreshYouTubeToken(account);
                return refreshed;
              }
              // For other platforms, remove expired token
              await supabase.from('social_tokens').delete().eq('id', account.id);
              return null;
            }

            // For YouTube, also validate token with API
            if (account.platform === 'youtube') {
              const isValid = await validateYouTubeToken(account.access_token);
              if (!isValid) {
                console.log('🔄 YouTube token invalid, attempting refresh...');
                const refreshed = await refreshYouTubeToken(account);
                return refreshed;
              }
            }
            
            return account;
          })
        );
        
        const validTokens = validatedAccounts.filter(Boolean) as SocialToken[];
        console.log('✅ Valid tokens after validation:', validTokens.length);
        setConnectedAccounts(validTokens);
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateYouTubeToken = async (token: string): Promise<boolean> => {
    try {
      console.log('🔍 Validating YouTube token...');
      const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('✅ YouTube token is valid');
        return true;
      } else {
        console.log('❌ YouTube token validation failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('💥 Error validating YouTube token:', error);
      return false;
    }
  };

  const refreshYouTubeToken = async (account: SocialToken): Promise<SocialToken | null> => {
    try {
      console.log('🔄 Attempting to refresh YouTube token for account:', account.id);
      
      if (!account.refresh_token) {
        console.log('❌ No refresh token available, user needs to re-authenticate');
        // Remove expired token from database
        await supabase.from('social_tokens').delete().eq('id', account.id);
        return null;
      }

      // Try to refresh the token using Supabase edge function
      const { data, error } = await supabase.functions.invoke('refresh-social-tokens', {
        body: { 
          platform: 'youtube',
          refresh_token: account.refresh_token,
          token_id: account.id
        }
      });

      if (error || !data?.access_token) {
        console.error('❌ Failed to refresh YouTube token:', error);
        // Remove expired token from database
        await supabase.from('social_tokens').delete().eq('id', account.id);
        return null;
      }

      console.log('✅ Successfully refreshed YouTube token');
      return data as SocialToken;
    } catch (error) {
      console.error('💥 Error refreshing YouTube token:', error);
      // Remove expired token from database on error
      try {
        await supabase.from('social_tokens').delete().eq('id', account.id);
      } catch (dbError) {
        console.error('Error cleaning up expired token:', dbError);
      }
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
