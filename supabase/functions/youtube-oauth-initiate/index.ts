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

    // Generate state parameter with user ID for security
    const state = `${user.id}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Build the OAuth URL
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/youtube-oauth`;
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    
    if (!clientId) {
      console.error('❌ Google Client ID not configured');
      return new Response(
        JSON.stringify({ error: 'Google OAuth not properly configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const scopes = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube';
    
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    console.log('🔗 Redirecting to Google OAuth:', {
      redirectUri,
      state: state.substring(0, 20) + '...',
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