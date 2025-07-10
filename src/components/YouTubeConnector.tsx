import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getYouTubeAuthStatus, 
  openYouTubeAuthPopup, 
  disconnectYouTube,
  testYouTubeConnection,
  type YouTubeAuthStatus 
} from '@/utils/youtubeAuth';

export const YouTubeConnector: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<YouTubeAuthStatus>({ isConnected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const checkAuthStatus = async () => {
    try {
      const status = await getYouTubeAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus({ isConnected: false, error: 'Failed to check connection status' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await openYouTubeAuthPopup();
      
      // Refresh status after successful connection
      await checkAuthStatus();
      
      toast({
        title: "Connected!",
        description: "Your YouTube account has been connected successfully.",
      });
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to connect YouTube account";
      
      // Provide specific guidance for common errors
      let description = errorMessage;
      if (errorMessage.includes('cancelled') || errorMessage.includes('closed')) {
        description = "Connection was cancelled. If you saw a security warning, click 'Advanced' then 'Go to site (unsafe)' to proceed.";
      } else if (errorMessage.includes('popup')) {
        description = "Please allow popups for this site and try again.";
      }
      
      toast({
        title: "Connection Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectYouTube();
      await checkAuthStatus();
      
      toast({
        title: "Disconnected",
        description: "Your YouTube account has been disconnected.",
      });
    } catch (error) {
      console.error('Disconnection failed:', error);
      toast({
        title: "Disconnection Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect YouTube account",
        variant: "destructive",
      });
    }
  };

  const handleTest = async () => {
    try {
      const result = await testYouTubeConnection();
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: `Channel: ${result.channelName}`,
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Checking YouTube connection...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-600" />
          YouTube Integration
        </CardTitle>
        <CardDescription>
          Connect your YouTube account to enable video uploads
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <strong>Note:</strong> You may see "Google hasn't verified this app" - this is normal for testing. 
            Click "Advanced" → "Go to {window.location.hostname} (unsafe)" to continue.
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {authStatus.isConnected ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Connected</span>
              <Badge variant="secondary">{authStatus.channelName}</Badge>
            </div>
            
            {authStatus.expiresAt && (
              <div className="text-xs text-muted-foreground">
                Token expires: {new Date(authStatus.expiresAt).toLocaleDateString()}
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleTest}
                variant="outline"
                size="sm"
              >
                Test Connection
              </Button>
              <Button 
                onClick={handleDisconnect}
                variant="outline"
                size="sm"
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Not Connected</span>
              {authStatus.error && (
                <Badge variant="destructive" className="text-xs">
                  {authStatus.error}
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Youtube className="mr-2 h-4 w-4" />
                    Connect YouTube
                  </>
                )}
              </Button>
              
              {authStatus.error && (
                <Button 
                  onClick={checkAuthStatus}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Refresh Status
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};