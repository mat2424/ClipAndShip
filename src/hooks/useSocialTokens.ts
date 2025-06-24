
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
        setConnectedAccounts(data || []);
      }
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
    } finally {
      setLoading(false);
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
        // Refresh the list
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
  };
};
