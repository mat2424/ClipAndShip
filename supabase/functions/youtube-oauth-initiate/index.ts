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
    // Enhanced environment variable checking
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasGoogleClientId: !!googleClientId,
      hasGoogleClientSecret: !!googleClientSecret,
      supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
    });

    if (!supabaseUrl || !googleClientId || !googleClientSecret) {
      console.error('❌ Missing required environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'OAuth configuration incomplete',
          details: 'Missing required Google OAuth credentials'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the current user to ensure they're authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🚀 Initiating YouTube OAuth for user:', user.id);

    // Generate state parameter with user ID for security and timestamp
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const state = `${user.id}-${timestamp}-${randomString}`;
    
    // Build the OAuth URL - ensure exact match with what we'll use in token exchange
    const redirectUri = `${supabaseUrl}/functions/v1/youtube-oauth`;
    
    const scopes = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
    
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
      `client_id=${encodeURIComponent(googleClientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;

    console.log('🔗 Generated OAuth URL:', {
      redirectUri,
      clientId: googleClientId.substring(0, 20) + '...',
      state: state.substring(0, 30) + '...',
      fullAuthUrl: authUrl.substring(0, 150) + '...',
    });

    // Return the OAuth URL instead of redirecting
    return new Response(
      JSON.stringify({ 
        authUrl: authUrl,
        message: 'Redirect to the provided authUrl' 
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('💥 Error initiating YouTube OAuth:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to initiate OAuth', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});