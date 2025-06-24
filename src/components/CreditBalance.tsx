
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const CreditBalance = () => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();

    // Subscribe to profile changes for real-time updates
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile updated:', payload);
          fetchCredits();
        }
      )
      .subscribe();

    // Also refresh credits every 30 seconds to ensure they're up to date
    const interval = setInterval(fetchCredits, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCredits(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching credits:', error);
      } else {
        setCredits(data?.credits || 0);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>;
  }

  return (
    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
      {credits} Credits
    </div>
  );
};
