
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleCustomOAuthCallback } from "@/utils/oauthUtils";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check for OAuth errors first
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        if (error) {
          console.error('OAuth error detected:', error, errorDescription);
          toast({
            title: "Connection Failed",
            description: errorDescription 
              ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
              : "Failed to connect account. Please try again.",
            variant: "destructive",
          });
          
          // Redirect to connect accounts page
          setTimeout(() => navigate("/connect-accounts"), 2000);
          return;
        }
        
        // Process successful callback
        const result = await handleCustomOAuthCallback();
        
        toast({
          title: "Success!",
          description: `Successfully connected your ${result.platform} account.`,
        });
        
        // Redirect to connect accounts page
        navigate("/connect-accounts");
      } catch (error) {
        console.error("OAuth callback error:", error);
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect account. Please try again.",
          variant: "destructive",
        });
        
        // Redirect to connect accounts page even on error
        setTimeout(() => navigate("/connect-accounts"), 2000);
      } finally {
        setProcessing(false);
      }
    };

    // Only process if we have the necessary URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    if (urlParams.get('code') || urlParams.get('error') || hashParams.get('error')) {
      processCallback();
    } else {
      // No OAuth parameters, redirect to connect accounts page
      navigate("/connect-accounts");
    }
  }, [navigate, toast]);

  if (processing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Connection
          </h2>
          <p className="text-gray-600 mb-6">
            Please wait while we process your connection...
          </p>
          
          {/* Back button for users who want to return immediately */}
          <Link
            to="/connect-accounts"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Connect Accounts</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Redirecting...
        </h2>
        <p className="text-gray-600 mb-6">
          Taking you back to your accounts page.
        </p>
        
        <Link
          to="/connect-accounts"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Connect Accounts</span>
        </Link>
      </div>
    </div>
  );
};

export default OAuthCallback;
