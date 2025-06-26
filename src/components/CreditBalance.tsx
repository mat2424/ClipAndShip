
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown } from "lucide-react";

export const CreditBalance = () => {
  const [credits, setCredits] = useState<number>(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreditsAndTier();

    // Subscribe to profile changes for real-time updates
    const channel = supabase
      .channel('profile-changes-unique')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile updated:', payload);
          fetchCreditsAndTier();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCreditsAndTier = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCredits(0);
        setSubscriptionTier('free');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('credits, subscription_tier')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits and tier:', error);
      } else {
        setCredits(data?.credits || 0);
        setSubscriptionTier(data?.subscription_tier || 'free');
      }
    } catch (error) {
      console.error('Error fetching credits and tier:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>;
  }

  const getTierDisplay = () => {
    switch (subscriptionTier) {
      case 'premium':
        return { text: 'Premium', color: 'bg-purple-100 text-purple-800' };
      case 'pro':
        return { text: 'Pro', color: 'bg-gold-100 text-gold-800' };
      default:
        return { text: 'Free', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const tierDisplay = getTierDisplay();

  return (
    <div className="flex items-center space-x-2">
      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
        {credits} Credits
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${tierDisplay.color}`}>
        {subscriptionTier !== 'free' && <Crown className="h-3 w-3" />}
        <span>{tierDisplay.text}</span>
      </div>
    </div>
  );
};
