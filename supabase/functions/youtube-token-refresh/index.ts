import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefreshTokenRequest {
  user_id: string;
  force_refresh?: boolean;
}

interface TokenRefreshResult {
  access_token: string;
  expires_at: string;
  refreshed: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, force_refresh = false }: RefreshTokenRequest = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get stored tokens
    const { data: tokenData, error: fetchError } = await supabaseClient
      .from('youtube_tokens')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (fetchError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'No YouTube tokens found for user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    const needsRefresh = force_refresh || expiresAt <= new Date(now.getTime() + 5 * 60 * 1000); // Refresh 5 minutes before expiry

    if (!needsRefresh) {
      console.log(`✅ Token still valid for user ${user_id}`);
      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          expires_at: tokenData.expires_at,
          refreshed: false
        } as TokenRefreshResult),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Refreshing token for user ${user_id}`);

    // Refresh the token
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error(`❌ Token refresh failed for user ${user_id}:`, errorText);
      
      // If refresh token is invalid, delete the stored tokens
      if (refreshResponse.status === 400) {
        await supabaseClient
          .from('youtube_tokens')
          .delete()
          .eq('user_id', user_id);
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Token refresh failed', 
          details: errorText,
          requires_reauth: refreshResponse.status === 400
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newTokenData = await refreshResponse.json();
    const newExpiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString();

    // Update stored tokens
    const { error: updateError } = await supabaseClient
      .from('youtube_tokens')
      .update({
        access_token: newTokenData.access_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error(`❌ Failed to update tokens for user ${user_id}:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Token refreshed successfully for user ${user_id}`);

    return new Response(
      JSON.stringify({
        access_token: newTokenData.access_token,
        expires_at: newExpiresAt,
        refreshed: true
      } as TokenRefreshResult),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Token refresh error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Token refresh failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Utility function to get valid access token (exported for reuse)
export async function getValidAccessToken(userId: string): Promise<string> {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/youtube-token-refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get valid access token: ${await response.text()}`);
  }

  const { access_token } = await response.json();
  return access_token;
}