
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type SocialPlatform = Database["public"]["Enums"]["social_platform"];

interface OAuthConfig {
  authUrl: string;
  clientId: string;
  scope: string;
  redirectUri: string;
}

// OAuth configurations for each platform
// These will need to be updated with actual client IDs and OAuth URLs
const oauthConfigs: Record<SocialPlatform, OAuthConfig> = {
  youtube: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: "YOUR_YOUTUBE_CLIENT_ID", // Replace with actual client ID
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
    redirectUri: `${window.location.origin}/oauth/callback/youtube`
  },
  tiktok: {
    authUrl: "https://www.tiktok.com/auth/authorize/",
    clientId: "YOUR_TIKTOK_CLIENT_ID", // Replace with actual client ID
    scope: "user.info.basic,video.upload",
    redirectUri: `${window.location.origin}/oauth/callback/tiktok`
  },
  instagram: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    clientId: "YOUR_INSTAGRAM_CLIENT_ID", // Replace with actual client ID
    scope: "user_profile,user_media",
    redirectUri: `${window.location.origin}/oauth/callback/instagram`
  },
  facebook: {
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    clientId: "YOUR_FACEBOOK_CLIENT_ID", // Replace with actual client ID
    scope: "pages_manage_posts,pages_read_engagement",
    redirectUri: `${window.location.origin}/oauth/callback/facebook`
  },
  x: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    clientId: "YOUR_X_CLIENT_ID", // Replace with actual client ID
    scope: "tweet.read tweet.write users.read",
    redirectUri: `${window.location.origin}/oauth/callback/x`
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    clientId: "YOUR_LINKEDIN_CLIENT_ID", // Replace with actual client ID
    scope: "r_liteprofile w_member_social",
    redirectUri: `${window.location.origin}/oauth/callback/linkedin`
  }
};

export const initiateOAuth = async (platform: SocialPlatform) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const config = oauthConfigs[platform];
    if (!config) {
      throw new Error(`OAuth configuration not found for platform: ${platform}`);
    }

    // Generate a state parameter for security
    const state = btoa(JSON.stringify({
      platform,
      userId: user.id,
      timestamp: Date.now()
    }));

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: "code",
      state: state,
    });

    const oauthUrl = `${config.authUrl}?${params.toString()}`;

    // Open OAuth flow in a new window
    const popup = window.open(
      oauthUrl,
      `${platform}_oauth`,
      "width=600,height=600,scrollbars=yes,resizable=yes"
    );

    // Listen for the OAuth callback
    return new Promise<boolean>((resolve, reject) => {
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_SUCCESS') {
          window.removeEventListener('message', messageListener);
          popup?.close();
          resolve(true);
        } else if (event.data.type === 'OAUTH_ERROR') {
          window.removeEventListener('message', messageListener);
          popup?.close();
          reject(new Error(event.data.error));
        }
      };

      window.addEventListener('message', messageListener);

      // Handle popup being closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          reject(new Error('OAuth flow was cancelled'));
        }
      }, 1000);
    });
  } catch (error) {
    console.error(`Error initiating OAuth for ${platform}:`, error);
    throw error;
  }
};

export const storeOAuthToken = async (
  platform: SocialPlatform,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.functions.invoke('handle-oauth-callback', {
      body: {
        user_id: user.id,
        platform,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error storing OAuth token:', error);
    throw error;
  }
};
