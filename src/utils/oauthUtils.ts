
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
  linkedin: "r_liteprofile w_member_social"
};

export const initiateOAuth = async (platform: SocialPlatform) => {
  try {
    // Check if platform is supported
    if (!platformProviderMap[platform]) {
      throw new Error(`${platform} OAuth is not currently supported`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const provider = platformProviderMap[platform];
    const scopes = platformScopes[platform];

    // Use Supabase's built-in OAuth with platform-specific scopes
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: "https://video-spark-publish.vercel.app/",
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

const storePlatformConnection = async (platform: SocialPlatform, userId: string) => {
  try {
    // Store a record of the platform connection
    // We'll use placeholder values since Supabase handles the actual tokens
    const { data, error } = await supabase
      .from('social_tokens')
      .upsert(
        {
          user_id: userId,
          platform,
          access_token: 'managed_by_supabase', // Placeholder
          refresh_token: null,
          expires_at: null,
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
