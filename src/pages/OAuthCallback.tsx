
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleCustomOAuthCallback } from "@/utils/oauthUtils";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
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
        navigate("/connect-accounts");
      } finally {
        setProcessing(false);
      }
    };

    // Only process if we have the necessary URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('code') || urlParams.get('error')) {
      processCallback();
    } else {
      // No OAuth parameters, redirect to main page
      navigate("/");
    }
  }, [navigate, toast]);

  if (processing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connecting Your Account
          </h2>
          <p className="text-gray-600">
            Please wait while we process your connection...
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;
