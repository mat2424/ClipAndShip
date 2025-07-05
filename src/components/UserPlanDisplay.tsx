import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Star, Zap } from "lucide-react";

export const UserPlanDisplay = () => {
  const [plan, setPlan] = useState<string>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (profile) {
        setPlan(profile.subscription_tier);
      }
    } catch (error) {
      console.error('Error fetching user plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const getPlanConfig = (planType: string) => {
    switch (planType) {
      case 'pro':
        return {
          label: 'Pro',
          icon: <Star className="h-3 w-3" />,
          variant: 'default' as const,
          className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
        };
      case 'premium':
        return {
          label: 'Premium',
          icon: <Crown className="h-3 w-3" />,
          variant: 'secondary' as const,
          className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
        };
      default:
        return {
          label: 'Free',
          icon: <Zap className="h-3 w-3" />,
          variant: 'outline' as const,
          className: 'border-muted-foreground/50 text-muted-foreground'
        };
    }
  };

  const config = getPlanConfig(plan);

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};