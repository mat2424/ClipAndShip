
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star } from "lucide-react";

const PRICING_TIERS = [
  { credits: 10, price: 30, popular: false },
  { credits: 25, price: 70, popular: true },
  { credits: 50, price: 120, popular: false },
  { credits: 100, price: 200, popular: false },
];

const SUBSCRIPTION_TIERS = [
  {
    name: 'Premium',
    price: 29,
    features: ['Access to Facebook, X, LinkedIn', 'Priority support', 'Advanced analytics'],
    icon: Crown,
    color: 'purple'
  },
  {
    name: 'Pro',
    price: 59,
    features: ['All Premium features', 'Custom branding', 'API access', 'Dedicated account manager'],
    icon: Star,
    color: 'gold'
  }
];

export const PricingSection = () => {
  const [loading, setLoading] = useState<number | null>(null);
  const [subLoading, setSubLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (credits: number, price: number) => {
    console.log("Starting purchase process:", { credits, price });
    setLoading(credits);
    
    try {
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to purchase credits",
          variant: "destructive",
        });
        return;
      }

      console.log("User authenticated, calling create-payment function");
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { credits, price }
      });

      console.log("Function response:", { data, error });

      if (error) {
        console.error("Function error:", error);
        throw error;
      }

      if (data?.url) {
        console.log("Redirecting to checkout:", data.url);
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSubscriptionUpgrade = async (tierName: string, price: number) => {
    setSubLoading(tierName);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upgrade your subscription",
          variant: "destructive",
        });
        return;
      }

      // For now, we'll show a coming soon message
      // In a real implementation, you'd integrate with Stripe subscriptions
      toast({
        title: "Coming Soon!",
        description: `${tierName} subscriptions will be available soon. Contact support for early access.`,
      });

    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Error",
        description: "Failed to process subscription upgrade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Credits Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Buy Credits</h2>
        <div className="space-y-4">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.credits}
              className={`border rounded-lg p-4 ${
                tier.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {tier.popular && (
                <div className="text-xs font-medium text-blue-600 mb-2">MOST POPULAR</div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{tier.credits} Credits</div>
                  <div className="text-sm text-gray-600">${tier.price}</div>
                  <div className="text-xs text-gray-500">
                    ${(tier.price / tier.credits).toFixed(2)} per credit
                  </div>
                </div>
                <Button
                  onClick={() => handlePurchase(tier.credits, tier.price)}
                  disabled={loading === tier.credits}
                  size="sm"
                  variant={tier.popular ? "default" : "outline"}
                >
                  {loading === tier.credits ? "Processing..." : "Buy Now"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Tiers Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upgrade Your Account</h2>
        <div className="space-y-4">
          {SUBSCRIPTION_TIERS.map((tier) => {
            const IconComponent = tier.icon;
            return (
              <div key={tier.name} className="border rounded-lg p-4 border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`h-5 w-5 text-${tier.color}-600`} />
                    <div className="font-semibold">{tier.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${tier.price}/month</div>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscriptionUpgrade(tier.name, tier.price)}
                  disabled={subLoading === tier.name}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  {subLoading === tier.name ? "Processing..." : `Upgrade to ${tier.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
