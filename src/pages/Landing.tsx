
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LandingHeader } from "@/components/LandingHeader";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { BenefitsSection } from "@/components/BenefitsSection";
import { CallToActionSection } from "@/components/CallToActionSection";
import { LandingFooter } from "@/components/LandingFooter";

const Landing = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Redirect authenticated users to dashboard
      if (session) {
        window.location.href = '/app';
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        // Redirect authenticated users to dashboard
        if (session) {
          window.location.href = '/app';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cool-charcoal">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cool-turquoise"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cool-charcoal text-white">
      <LandingHeader user={user} />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <CallToActionSection />
      <LandingFooter />
    </div>
  );
};

export default Landing;
