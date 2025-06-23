import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PRICING_TIERS = [
  { credits: 10, price: 30, popular: false },
  { credits: 25, price: 70, popular: true },
  { credits: 50, price: 120, popular: false },
  { credits: 100, price: 200, popular: false },
];

export const PricingSection = () => {
  const [loading, setLoading] = useState<number | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (credits: number, price: number) => {
    setLoading(credits);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { credits, price }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
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
  );
};
