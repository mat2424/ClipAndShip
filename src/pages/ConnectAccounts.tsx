import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SocialAccountsManager } from "@/components/SocialAccountsManager";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ConnectAccounts = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for connection success messages
    const youtube = searchParams.get('youtube');
    
    if (youtube === 'connected') {
      toast({
        title: "Success!",
        description: "Successfully connected your YouTube account with upload permissions.",
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/app" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <img src="/lovable-uploads/02ed2fe3-1ff8-4c39-86c1-1c2c8e1be28c.png" alt="Clip & Ship AI Logo" className="w-8 h-8 object-contain" />
                <h1 className="text-xl font-bold text-foreground">Clip & Ship AI</h1>
              </Link>
            </div>
            
            <Link to="/app">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Connect Your Social Accounts
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect your social media accounts to automatically publish your videos across platforms. 
            Your tokens are securely stored and never shared.
          </p>
        </div>

        <SocialAccountsManager />
        
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Once connected, you'll be able to publish videos directly to your social platforms from the dashboard.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ConnectAccounts;