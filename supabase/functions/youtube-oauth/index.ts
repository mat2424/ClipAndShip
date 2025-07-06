import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { searchParams } = new URL(req.url);
    const authCode = searchParams.get('code');
    const state = searchParams.get('state');

    if (!authCode) {
      console.error('❌ No authorization code provided');
      return new Response(
        JSON.stringify({ error: 'No authorization code provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!state) {
      console.error('❌ No state parameter provided');
      return new Response(
        JSON.stringify({ error: 'No state parameter provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract user ID from state (format: userId-randomString)
    const userId = state.split('-')[0];
    if (!userId) {
      console.error('❌ Invalid state parameter');
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔄 Processing YouTube OAuth for user:', userId, 'with code:', authCode.substring(0, 10) + '...');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: authCode,
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        redirect_uri: `${Deno.env.get('SUPABASE_URL')}/functions/v1/youtube-oauth`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code', details: errorText }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Test the YouTube API to get channel info
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!channelResponse.ok) {
      console.error('❌ YouTube API test failed:', channelResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to verify YouTube permissions' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const channelData = await channelResponse.json();
    const channelName = channelData.items?.[0]?.snippet?.title || 'YouTube Channel';
    console.log('📺 YouTube channel verified:', channelName);

    // Calculate expiration date
    let expirationDate = null;
    if (tokenData.expires_in) {
      expirationDate = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    }

    // Store the YouTube connection in the database
    const { data: socialToken, error: dbError } = await supabaseClient
      .from('social_tokens')
      .upsert(
        {
          user_id: userId,
          platform: 'youtube',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: expirationDate,
          username: channelName,
        },
        {
          onConflict: 'user_id,platform'
        }
      )
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save connection', details: dbError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ YouTube connection saved successfully');

    // Redirect to app page on the main domain
    const redirectUrl = `https://clipandship.ca/#/app?youtube=connected`;
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});