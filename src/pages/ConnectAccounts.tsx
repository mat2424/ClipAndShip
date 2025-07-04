
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AuthForm } from "@/components/AuthForm";
import { SocialAccountsManager } from "@/components/SocialAccountsManager";
import { Link } from "react-router-dom";
import { ArrowLeft, Settings, Menu, X, CreditCard, User as UserIcon, LogOut, Clock } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title - Clickable to return to landing */}
            <Link to="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src="/lovable-uploads/02ed2fe3-1ff8-4c39-86c1-1c2c8e1be28c.png" 
                alt="Clip & Ship AI Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain flex-shrink-0"
              />
              <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-foreground truncate">Clip & Ship</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-4">
              <Link to="/pending-videos">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending Videos</span>
                </Button>
              </Link>
              
              <CreditBalance />
              
              <Link
                to="/app"
                className="flex items-center space-x-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors border border-border text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Main Page</span>
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="bg-destructive text-destructive-foreground px-3 py-2 rounded-md hover:bg-destructive/90 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                    <Menu className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border text-foreground">
                  <DropdownMenuLabel className="text-primary">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  
                  <DropdownMenuItem asChild className="hover:bg-accent">
                    <Link to="/connect-accounts" className="flex items-center space-x-2 w-full">
                      <Settings className="w-4 h-4" />
                      <span>Connect Accounts</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="hover:bg-accent cursor-default">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4" />
                        <span>Balance</span>
                      </div>
                      <CreditBalance />
                    </div>
                  </DropdownMenuItem>
                  
                  
                  <DropdownMenuSeparator className="bg-border" />
                  
                  <DropdownMenuItem 
                    onClick={() => supabase.auth.signOut()}
                    className="hover:bg-destructive/10 text-destructive hover:text-destructive"
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
        <div className="bg-primary/10 rounded-lg shadow-lg p-4 sm:p-6 border border-border">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">Connect Your Social Media Accounts</h2>
            <p className="text-muted-foreground text-sm sm:text-base px-2">
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
