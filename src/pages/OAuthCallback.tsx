
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleCustomOAuthCallback } from "@/utils/oauthUtils";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Handle Supabase OAuth callback (access_token in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for OAuth errors first
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
        
        if (error) {
          console.error('OAuth error detected:', error, errorDescription, errorCode);
          
          let userMessage = "Failed to connect account. Please try again.";
          
          if (error === 'server_error' && errorCode === 'unexpected_failure') {
            userMessage = "There was an issue with the authentication server. Please try connecting again.";
          } else if (errorDescription) {
            userMessage = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
          }
          
          toast({
            title: "Connection Failed",
            description: userMessage,
            variant: "destructive",
          });
          
          setTimeout(() => navigate("/connect-accounts"), 2000);
          return;
        }
        
        // Check for Supabase OAuth tokens in hash (for OAuth providers like Google)
        const accessToken = hashParams.get('access_token');
        const providerToken = hashParams.get('provider_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && providerToken) {
          console.log('Processing Supabase OAuth callback with tokens');
          
          // Get the current user to identify which platform this is for
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Store the connection in our database
            // We'll assume this is YouTube since that's what we're connecting
            const { data, error } = await supabase
              .from('social_tokens')
              .upsert(
                {
                  user_id: user.id,
                  platform: 'youtube',
                  access_token: providerToken, // Use the provider token for API calls
                  refresh_token: refreshToken,
                  expires_at: hashParams.get('expires_at') ? 
                    new Date(parseInt(hashParams.get('expires_at')!) * 1000).toISOString() : null,
                },
                {
                  onConflict: 'user_id,platform'
                }
              )
              .select()
              .single();

            if (error) {
              console.error('Error storing social token:', error);
              throw new Error('Failed to save connection');
            }

            toast({
              title: "Success!",
              description: "Successfully connected your YouTube account.",
            });
          }
          
          navigate("/connect-accounts");
          return;
        }
        
        // Check for custom OAuth code (for TikTok/Instagram)
        const code = urlParams.get('code');
        if (code) {
          console.log('Processing custom OAuth callback with code');
          const result = await handleCustomOAuthCallback();
          
          toast({
            title: "Success!",
            description: `Successfully connected your ${result.platform} account.`,
          });
          
          navigate("/connect-accounts");
          return;
        }
        
        // No OAuth parameters found
        console.log('No OAuth parameters found, redirecting to connect accounts');
        navigate("/connect-accounts");
        
      } catch (error) {
        console.error("OAuth callback error:", error);
        
        let errorMessage = "Failed to connect account. Please try again.";
        
        if (error instanceof Error) {
          if (error.message.includes('404') || error.message.includes('NOT_FOUND')) {
            errorMessage = "Authentication service temporarily unavailable. Please try again in a moment.";
          } else {
            errorMessage = error.message;
          }
        }
        
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        setTimeout(() => navigate("/connect-accounts"), 2000);
      } finally {
        setProcessing(false);
      }
    };

    processCallback();
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
