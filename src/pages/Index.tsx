
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AuthForm } from "@/components/AuthForm";
import { VideoIdeaForm } from "@/components/VideoIdeaForm";
import { CreditBalance } from "@/components/CreditBalance";
import { VideoIdeasList } from "@/components/VideoIdeasList";
import { PricingSection } from "@/components/PricingSection";
import { Link } from "react-router-dom";
import { Settings, Menu, CreditCard, User as UserIcon, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

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
      <div className="min-h-screen flex items-center justify-center bg-cool-charcoal">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cool-sky"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-cool-charcoal">
      <header className="bg-cool-navy shadow-lg border-b border-cool-sky/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Title - Clickable to return to landing */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src="/lovable-uploads/f280c057-8466-4c81-8f30-692c7acda621.png" 
                alt="Clip & Ship AI Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
              />
              <h1 className="text-lg sm:text-2xl font-bold text-cool-white truncate">Clip & Ship AI</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
              <CreditBalance />
              <Link
                to="/connect-accounts"
                className="flex items-center space-x-1 sm:space-x-2 bg-cool-sky text-cool-charcoal px-2 sm:px-4 py-2 rounded-md hover:bg-cool-sky/90 transition-colors text-sm sm:text-base font-medium"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">My Social Accounts</span>
                <span className="sm:hidden">Accounts</span>
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-cool-navy text-cool-light px-2 sm:px-4 py-2 rounded-md hover:bg-cool-charcoal transition-colors border border-cool-sky/30 text-sm sm:text-base whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-cool-sky/30 text-cool-light hover:bg-cool-charcoal bg-cool-navy">
                    <Menu className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-cool-navy border-cool-sky/30 text-cool-white z-50">
                  <DropdownMenuLabel className="text-cool-sky flex items-center justify-between">
                    <span>Account Settings</span>
                    <CreditBalance />
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-cool-sky/20" />
                  
                  <DropdownMenuItem asChild className="hover:bg-cool-charcoal focus:bg-cool-charcoal">
                    <Link to="/connect-accounts" className="flex items-center space-x-2 w-full">
                      <Settings className="w-4 h-4" />
                      <span>My Social Accounts</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-cool-sky/20" />
                  
                  <DropdownMenuItem 
                    onClick={() => supabase.auth.signOut()}
                    className="hover:bg-cool-rose/20 text-cool-rose hover:text-cool-rose focus:bg-cool-rose/20"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2">
            <VideoIdeaForm />
            <div className="mt-4 sm:mt-8">
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
