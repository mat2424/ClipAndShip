
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AuthForm } from "@/components/AuthForm";
import { SocialAccountsManager } from "@/components/SocialAccountsManager";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings, Menu, X, CreditCard, User as UserIcon, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CreditBalance } from "@/components/CreditBalance";

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
      <div className="min-h-screen flex items-center justify-center bg-cool-charcoal">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cool-turquoise"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-cool-charcoal">
      <header className="bg-cool-navy shadow-lg border-b border-cool-turquoise">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Title - Clickable to return to landing */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src="/lovable-uploads/f280c057-8466-4c81-8f30-692c7acda621.png" 
                alt="Clip & Ship AI Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
              />
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-white truncate">Connect Social Accounts</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-4">
              <CreditBalance />
              <Link
                to="/app"
                className="flex items-center space-x-2 bg-cool-gray text-white px-3 py-2 rounded-md hover:bg-cool-gray/80 transition-colors border border-cool-turquoise text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Main Page</span>
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-cool-turquoise text-white hover:bg-cool-gray bg-cool-navy">
                    <Menu className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-cool-navy border-cool-turquoise text-white">
                  <DropdownMenuLabel className="text-cool-turquoise">Account Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-cool-turquoise/30" />
                  
                  <DropdownMenuItem asChild className="hover:bg-cool-gray">
                    <Link to="/app" className="flex items-center space-x-2 w-full">
                      <UserIcon className="w-4 h-4" />
                      <span>Main Page</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="hover:bg-cool-gray cursor-default">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Credits</span>
                      </div>
                      <CreditBalance />
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="hover:bg-cool-gray cursor-default">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Free Plan</span>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-cool-turquoise/30" />
                  
                  <DropdownMenuItem 
                    onClick={() => supabase.auth.signOut()}
                    className="hover:bg-red-900/50 text-red-400 hover:text-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-cool-turquoise rounded-lg shadow-lg p-4 sm:p-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-cool-charcoal mb-2">Connect Your Social Media Accounts</h2>
            <p className="text-cool-charcoal/80 text-sm sm:text-base px-2">
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
