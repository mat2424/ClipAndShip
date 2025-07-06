
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

// TikTok and Instagram client configuration
// You need to set these in your TikTok and Instagram developer portals
const CLIENT_CONFIG = {
  tiktok: {
    clientId: "YOUR_TIKTOK_CLIENT_KEY", // Replace with your actual TikTok client key
    authUrl: "https://www.tiktok.com/v2/auth/authorize/"
  },
  instagram: {
    clientId: "YOUR_INSTAGRAM_CLIENT_ID", // Replace with your actual Instagram client ID
    authUrl: "https://api.instagram.com/oauth/authorize"
  }
};

export const initiateOAuth = async (platform: SocialPlatform) => {
  try {
    console.log(`🚀 Starting OAuth for platform: ${platform}`);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error("User not authenticated");
    }

    console.log(`✅ User authenticated: ${user.id}`);

    // Handle YouTube with direct Google OAuth to edge function
    if (platform === 'youtube') {
      console.log('🎬 Using direct YouTube OAuth flow');
      return await initiateYouTubeOAuth();
    }

    // Handle custom OAuth flows for TikTok and Instagram
    if (platform === 'tiktok' || platform === 'instagram') {
      console.log(`🔀 Using custom OAuth flow for ${platform}`);
      return await initiateCustomOAuth(platform);
    }

    // Check if platform is supported by Supabase
    if (!platformProviderMap[platform]) {
      console.error(`❌ Platform ${platform} not supported`);
      throw new Error(`${platform} OAuth is not currently supported`);
    }

    const provider = platformProviderMap[platform];
    const scopes = platformScopes[platform];

    // Use the current origin for redirect
    const redirectTo = `${window.location.origin}/#/oauth-callback`;

    console.log(`🔗 OAuth config:`, {
      provider,
      scopes,
      redirectTo,
      currentUrl: window.location.href
    });

    // Use Supabase's built-in OAuth with platform-specific scopes
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectTo,
        scopes: scopes,
        queryParams: {
          platform: platform // Pass platform info for later identification
        }
      }
    });

    if (error) {
      console.error(`❌ OAuth initiation failed:`, error);
      throw error;
    }

    console.log(`✅ OAuth initiated successfully:`, data);
    return data;
  } catch (error) {
    console.error(`💥 Error initiating OAuth for ${platform}:`, error);
    throw error;
  }
};

// Custom OAuth flow for TikTok and Instagram
const initiateCustomOAuth = async (platform: 'tiktok' | 'instagram') => {
  try {
    console.log(`🔧 Setting up custom OAuth for ${platform}`);
    
    // Generate a random state parameter for security
    const state = generateRandomState();
    
    // Store state in localStorage for verification later
    localStorage.setItem(`${platform}_oauth_state`, state);
    
    const redirectUri = `${window.location.origin}/#/oauth-callback`;
    
    let authUrl = '';
    
    if (platform === 'tiktok') {
      // Check if client ID is configured
      if (CLIENT_CONFIG.tiktok.clientId === 'YOUR_TIKTOK_CLIENT_KEY') {
        throw new Error('TikTok client ID not configured. Please update the CLIENT_CONFIG in oauthUtils.ts with your actual TikTok client key from the developer portal.');
      }
      
      authUrl = `${CLIENT_CONFIG.tiktok.authUrl}?` +
        `client_key=${CLIENT_CONFIG.tiktok.clientId}&` +
        `scope=${platformScopes.tiktok}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;
        
      console.log(`🎯 TikTok OAuth URL:`, authUrl);
      
    } else if (platform === 'instagram') {
      // Check if client ID is configured
      if (CLIENT_CONFIG.instagram.clientId === 'YOUR_INSTAGRAM_CLIENT_ID') {
        throw new Error('Instagram client ID not configured. Please update the CLIENT_CONFIG in oauthUtils.ts with your actual Instagram client ID from the Facebook Developer portal.');
      }
      
      authUrl = `${CLIENT_CONFIG.instagram.authUrl}?` +
        `client_id=${CLIENT_CONFIG.instagram.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${platformScopes.instagram}&` +
        `response_type=code&` +
        `state=${state}`;
        
      console.log(`📸 Instagram OAuth URL:`, authUrl);
    }
    
    console.log(`🚀 Redirecting to ${platform} OAuth...`);
    
    // Redirect to the OAuth provider
    window.location.href = authUrl;
    
    return { data: null, error: null };
  } catch (error) {
    console.error(`💥 Error initiating custom OAuth for ${platform}:`, error);
    throw error;
  }
};

// Handle OAuth callback for custom flows
export const handleCustomOAuthCallback = async () => {
  try {
    console.log('🔄 Processing custom OAuth callback...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    console.log('📋 Callback parameters:', { 
      hasCode: !!code, 
      hasState: !!state, 
      error: error 
    });
    
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
    
    console.log(`✅ Identified platform: ${platform}`);
    
    // For now, we'll create a mock token since server-side exchange isn't implemented yet
    const mockTokenData = {
      access_token: `mock_${platform}_token_${Date.now()}`,
      token_type: 'bearer',
      expires_in: 3600
    };
    
    // Store the connection in our database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log(`💾 Storing ${platform} connection for user:`, user.id);
      await storePlatformConnection(platform, user.id, mockTokenData);
    }
    
    return { platform, tokenData: mockTokenData };
  } catch (error) {
    console.error('💥 Error handling OAuth callback:', error);
    throw error;
  }
};

const storePlatformConnection = async (platform: SocialPlatform, userId: string, tokenData?: any) => {
  try {
    console.log(`💾 Storing connection for ${platform}...`);
    
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
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log(`✅ Successfully stored ${platform} connection:`, data);
    return data;
  } catch (error) {
    console.error('💥 Error storing platform connection:', error);
    throw error;
  }
};

  // YouTube OAuth flow using Supabase's built-in Google OAuth
const initiateYouTubeOAuth = async () => {
  try {
    console.log('🎬 Setting up YouTube OAuth flow with Supabase');
    
    // Use the current origin for redirect
    const redirectTo = `${window.location.origin}/#/oauth-callback`;
    
    console.log('🔗 YouTube OAuth config:', {
      redirectTo,
      scopes: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
      currentUrl: window.location.href
    });

    // Use Supabase's built-in Google OAuth with YouTube scopes
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        scopes: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
        queryParams: {
          platform: 'youtube',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      console.error('❌ YouTube OAuth initiation failed:', error);
      throw error;
    }

    console.log('✅ YouTube OAuth initiated successfully:', data);
    return data;
  } catch (error) {
    console.error('💥 Error initiating YouTube OAuth:', error);
    throw error;
  }
};

// Generate random state for OAuth security
const generateRandomState = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};
