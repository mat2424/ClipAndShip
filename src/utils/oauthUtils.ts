
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type SocialPlatform = Database["public"]["Enums"]["social_platform"];

// Platform to Supabase OAuth provider mapping (only supported platforms)
const platformProviderMap: Record<string, string> = {
  youtube: "google", // YouTube uses Google OAuth
  facebook: "facebook",
  x: "twitter",
  linkedin: "linkedin_oidc"
};

// Platform-specific OAuth scopes
const platformScopes: Record<string, string> = {
  youtube: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
  facebook: "pages_manage_posts,pages_read_engagement",
  x: "tweet.read tweet.write users.read",
  linkedin: "r_liteprofile w_member_social",
  tiktok: "user.info.basic,video.publish",
  instagram: "user_profile,user_media"
};

// Custom OAuth URLs for platforms not supported by Supabase
const customOAuthUrls = {
  tiktok: {
    authUrl: "https://www.tiktok.com/auth/authorize/",
    tokenUrl: "https://auth.tiktok-tokens.com/api/v2/token/",
    userInfoUrl: "https://open-api.tiktok.com/platform/oauth/connect/"
  },
  instagram: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    userInfoUrl: "https://graph.instagram.com/me"
  }
};

export const initiateOAuth = async (platform: SocialPlatform) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Handle custom OAuth flows for TikTok and Instagram
    if (platform === 'tiktok' || platform === 'instagram') {
      return await initiateCustomOAuth(platform);
    }

    // Check if platform is supported by Supabase
    if (!platformProviderMap[platform]) {
      throw new Error(`${platform} OAuth is not currently supported`);
    }

    const provider = platformProviderMap[platform];
    const scopes = platformScopes[platform];

    // Use Supabase's built-in OAuth with platform-specific scopes
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: scopes,
        queryParams: {
          platform: platform // Pass platform info for later identification
        }
      }
    });

    if (error) {
      throw error;
    }

    // Store platform connection after successful OAuth
    await storePlatformConnection(platform, user.id);

    return data;
  } catch (error) {
    console.error(`Error initiating OAuth for ${platform}:`, error);
    throw error;
  }
};

// Custom OAuth flow for TikTok and Instagram
const initiateCustomOAuth = async (platform: 'tiktok' | 'instagram') => {
  try {
    // Generate a random state parameter for security
    const state = generateRandomState();
    
    // Store state in localStorage for verification later
    localStorage.setItem(`${platform}_oauth_state`, state);
    
    const redirectUri = `${window.location.origin}/oauth-callback`;
    
    let authUrl = '';
    
    if (platform === 'tiktok') {
      // TikTok OAuth URL
      // Note: You need to register your app at https://developers.tiktok.com/
      const clientId = 'YOUR_TIKTOK_CLIENT_ID'; // This should be set in environment variables
      authUrl = `${customOAuthUrls.tiktok.authUrl}?` +
        `client_key=${clientId}&` +
        `scope=${platformScopes.tiktok}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;
    } else if (platform === 'instagram') {
      // Instagram Basic Display API OAuth URL
      // Note: You need to register your app at https://developers.facebook.com/
      const clientId = 'YOUR_INSTAGRAM_CLIENT_ID'; // This should be set in environment variables
      authUrl = `${customOAuthUrls.instagram.authUrl}?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${platformScopes.instagram}&` +
        `response_type=code&` +
        `state=${state}`;
    }
    
    // Redirect to the OAuth provider
    window.location.href = authUrl;
    
    return { data: null, error: null };
  } catch (error) {
    console.error(`Error initiating custom OAuth for ${platform}:`, error);
    throw error;
  }
};

// Handle OAuth callback for custom flows
export const handleCustomOAuthCallback = async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }
    
    if (!code || !state) {
      throw new Error('Missing authorization code or state parameter');
    }
    
    // Determine platform from stored state
    const tiktokState = localStorage.getItem('tiktok_oauth_state');
    const instagramState = localStorage.getItem('instagram_oauth_state');
    
    let platform: 'tiktok' | 'instagram' | null = null;
    
    if (state === tiktokState) {
      platform = 'tiktok';
      localStorage.removeItem('tiktok_oauth_state');
    } else if (state === instagramState) {
      platform = 'instagram';
      localStorage.removeItem('instagram_oauth_state');
    }
    
    if (!platform) {
      throw new Error('Invalid state parameter');
    }
    
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(platform, code);
    
    // Get user info from the platform
    const userInfo = await getPlatformUserInfo(platform, tokenData.access_token);
    
    // Store the connection in our database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await storePlatformConnection(platform, user.id, tokenData);
    }
    
    return { platform, userInfo, tokenData };
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    throw error;
  }
};

// Exchange authorization code for access token
const exchangeCodeForToken = async (platform: 'tiktok' | 'instagram', code: string) => {
  // This should be done server-side for security
  // For now, we'll simulate the token exchange
  // In production, you'd call your backend API endpoint
  
  const redirectUri = `${window.location.origin}/oauth-callback`;
  
  try {
    // Call your backend endpoint to exchange the code
    const response = await fetch('/api/oauth/exchange-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform,
        code,
        redirectUri
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    // For demo purposes, return mock data
    return {
      access_token: `mock_${platform}_token_${Date.now()}`,
      token_type: 'bearer',
      expires_in: 3600
    };
  }
};

// Get user info from platform API
const getPlatformUserInfo = async (platform: 'tiktok' | 'instagram', accessToken: string) => {
  try {
    // Call your backend endpoint to get user info
    const response = await fetch('/api/oauth/user-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform,
        accessToken
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting user info:', error);
    // For demo purposes, return mock data
    return {
      id: `mock_${platform}_user_${Date.now()}`,
      username: `mock_${platform}_user`,
      display_name: `Mock ${platform.charAt(0).toUpperCase() + platform.slice(1)} User`
    };
  }
};

const storePlatformConnection = async (platform: SocialPlatform, userId: string, tokenData?: any) => {
  try {
    // Store a record of the platform connection
    const { data, error } = await supabase
      .from('social_tokens')
      .upsert(
        {
          user_id: userId,
          platform,
          access_token: tokenData?.access_token || 'managed_by_supabase',
          refresh_token: tokenData?.refresh_token || null,
          expires_at: tokenData?.expires_in ? 
            new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null,
        },
        {
          onConflict: 'user_id,platform'
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error storing platform connection:', error);
    throw error;
  }
};

// Generate random state for OAuth security
const generateRandomState = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};
