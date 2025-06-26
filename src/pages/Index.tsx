
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AuthForm } from "@/components/AuthForm";
import { VideoIdeaForm } from "@/components/VideoIdeaForm";
import { CreditBalance } from "@/components/CreditBalance";
import { VideoIdeasList } from "@/components/VideoIdeasList";
import { PricingSection } from "@/components/PricingSection";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 shadow-lg border-b border-pink-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/f280c057-8466-4c81-8f30-692c7acda621.png" 
              alt="Clip & Ship AI Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-2xl font-bold text-white">Clip & Ship AI</h1>
          </div>
          <div className="flex items-center space-x-4">
            <CreditBalance />
            <Link
              to="/connect-accounts"
              className="flex items-center space-x-2 bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>My Social Accounts</span>
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors border border-pink-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <VideoIdeaForm />
            <div className="mt-8">
              <VideoIdeasList />
            </div>
          </div>
          <div>
            <PricingSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
