
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AuthForm } from "@/components/AuthForm";
import { SocialAccountsManager } from "@/components/SocialAccountsManager";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ConnectAccounts = () => {
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <img 
                src="/lovable-uploads/f280c057-8466-4c81-8f30-692c7acda621.png" 
                alt="Clip & Ship AI Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
              />
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white truncate">Connect Social Accounts</h1>
            </div>
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
              <Link
                to="/app"
                className="flex items-center space-x-1 sm:space-x-2 bg-gray-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-gray-600 transition-colors border border-pink-500 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline sm:hidden">Back</span>
                <span className="hidden sm:inline">Back to Main Page</span>
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-red-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md hover:bg-red-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-[#621fff] rounded-lg shadow-lg p-4 sm:p-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Connect Your Social Media Accounts</h2>
            <p className="text-pink-200 text-sm sm:text-base px-2">
              Link your social media accounts to automatically publish your AI-generated videos across multiple platforms.
            </p>
          </div>
          
          <SocialAccountsManager />
        </div>
      </main>
    </div>
  );
};

export default ConnectAccounts;
