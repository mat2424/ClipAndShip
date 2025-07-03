import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefreshTokenPayload {
  user_id: string;
  platform: string;
  refresh_token: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: RefreshTokenPayload = await req.json();
    console.log('🔄 Refreshing token for:', payload.platform);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let newTokens;
    
    switch (payload.platform.toLowerCase()) {
      case 'youtube':
        newTokens = await refreshYouTubeToken(payload.refresh_token);
        break;
      case 'tiktok':
        newTokens = await refreshTikTokToken(payload.refresh_token);
        break;
      case 'instagram':
        newTokens = await refreshInstagramToken(payload.refresh_token);
        break;
      default:
        throw new Error(`Platform ${payload.platform} not supported`);
    }

    if (newTokens.success) {
      // Update the token in database
      const { error: updateError } = await supabase
        .from('social_tokens')
        .update({
          access_token: newTokens.access_token,
          refresh_token: newTokens.refresh_token || payload.refresh_token,
          expires_at: newTokens.expires_at ? new Date(newTokens.expires_at).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', payload.user_id)
        .eq('platform', payload.platform.toLowerCase());

      if (updateError) throw updateError;

      console.log('✅ Token refreshed successfully');
      
      return new Response(
        JSON.stringify({ success: true, access_token: newTokens.access_token }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(newTokens.error || 'Token refresh failed');
    }

  } catch (error) {
    console.error('💥 Token refresh error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Token refresh failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshYouTubeToken(refreshToken: string) {
  try {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    
    if (!clientId || !clientSecret) {
      return { success: false, error: 'Google OAuth credentials not configured' };
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `YouTube token refresh failed: ${errorText}` };
    }

    const result = await response.json();
    
    return {
      success: true,
      access_token: result.access_token,
      refresh_token: result.refresh_token || refreshToken,
      expires_at: result.expires_in ? Date.now() + (result.expires_in * 1000) : null
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function refreshTikTokToken(refreshToken: string) {
  try {
    const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
    const clientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET");
    
    if (!clientKey || !clientSecret) {
      return { success: false, error: 'TikTok OAuth credentials not configured' };
    }

    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `TikTok token refresh failed: ${errorText}` };
    }

    const result = await response.json();
    
    return {
      success: true,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_at: result.expires_in ? Date.now() + (result.expires_in * 1000) : null
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function refreshInstagramToken(refreshToken: string) {
  try {
    const clientId = Deno.env.get("INSTAGRAM_CLIENT_ID");
    const clientSecret = Deno.env.get("INSTAGRAM_CLIENT_SECRET");
    
    if (!clientId || !clientSecret) {
      return { success: false, error: 'Instagram OAuth credentials not configured' };
    }

    const response = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: clientId,
        client_secret: clientSecret,
        fb_exchange_token: refreshToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Instagram token refresh failed: ${errorText}` };
    }

    const result = await response.json();
    
    return {
      success: true,
      access_token: result.access_token,
      refresh_token: refreshToken, // Instagram doesn't provide new refresh tokens
      expires_at: result.expires_in ? Date.now() + (result.expires_in * 1000) : null
    };

  } catch (error) {
    return { success: false, error: error.message };
  }
}