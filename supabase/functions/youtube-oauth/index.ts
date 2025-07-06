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

  const requestId = Math.random().toString(36).substring(2, 8);
  
  try {
    // Enhanced environment variable checking
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    console.log(`🔧 [${requestId}] Environment check:`, {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasGoogleClientId: !!googleClientId,
      hasGoogleClientSecret: !!googleClientSecret,
      supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
    });

    if (!supabaseUrl || !supabaseServiceKey || !googleClientId || !googleClientSecret) {
      console.error(`❌ [${requestId}] Missing required environment variables`);
      return new Response(
        JSON.stringify({ 
          error: 'OAuth configuration incomplete',
          details: 'Missing required environment variables'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, { 
      auth: { persistSession: false } 
    });

    const { searchParams } = new URL(req.url);
    const authCode = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log(`📋 [${requestId}] Callback parameters:`, {
      hasCode: !!authCode,
      hasState: !!state,
      error: error,
      codePreview: authCode?.substring(0, 10) + '...',
      statePreview: state?.substring(0, 20) + '...',
    });

    if (error) {
      console.error(`❌ [${requestId}] OAuth error from Google:`, error);
      return new Response(
        JSON.stringify({ error: `OAuth error: ${error}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!authCode) {
      console.error(`❌ [${requestId}] No authorization code provided`);
      return new Response(
        JSON.stringify({ error: 'No authorization code provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!state) {
      console.error(`❌ [${requestId}] No state parameter provided`);
      return new Response(
        JSON.stringify({ error: 'No state parameter provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract user ID from state - handle both old and new formats
    const stateParts = state.split('-');
    const userId = stateParts[0];
    const timestamp = stateParts[1] ? parseInt(stateParts[1]) : null;
    
    if (!userId) {
      console.error(`❌ [${requestId}] Invalid state parameter format`);
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if the state is not too old (15 minutes max)
    if (timestamp && Date.now() - timestamp > 15 * 60 * 1000) {
      console.error(`❌ [${requestId}] OAuth state expired`);
      return new Response(
        JSON.stringify({ error: 'OAuth session expired, please try again' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔄 [${requestId}] Processing YouTube OAuth for user:`, userId);

    // Prepare token exchange parameters
    const redirectUri = `${supabaseUrl}/functions/v1/youtube-oauth`;
    const tokenRequestBody = new URLSearchParams({
      code: authCode,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    console.log(`🔄 [${requestId}] Token exchange request:`, {
      redirectUri,
      clientId: googleClientId.substring(0, 20) + '...',
      hasClientSecret: !!googleClientSecret,
      grantType: 'authorization_code',
    });

    // Exchange authorization code for access token with retry mechanism
    let tokenResponse;
    let attempt = 1;
    const maxAttempts = 3;

    while (attempt <= maxAttempts) {
      console.log(`🔄 [${requestId}] Token exchange attempt ${attempt}/${maxAttempts}`);
      
      try {
        tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: tokenRequestBody,
        });

        console.log(`📡 [${requestId}] Token response status:`, tokenResponse.status);
        
        if (tokenResponse.ok) {
          break; // Success, exit retry loop
        } else {
          const responseText = await tokenResponse.text();
          console.error(`❌ [${requestId}] Token exchange failed (attempt ${attempt}):`, {
            status: tokenResponse.status,
            statusText: tokenResponse.statusText,
            response: responseText,
          });
          
          if (attempt === maxAttempts) {
            return new Response(
              JSON.stringify({ 
                error: 'Failed to exchange authorization code', 
                details: responseText,
                status: tokenResponse.status 
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
      } catch (fetchError) {
        console.error(`❌ [${requestId}] Token exchange fetch error (attempt ${attempt}):`, fetchError);
        
        if (attempt === maxAttempts) {
          return new Response(
            JSON.stringify({ 
              error: 'Network error during token exchange', 
              details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
      
      attempt++;
      // Wait 1 second before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const tokenData = await tokenResponse!.json();
    console.log(`✅ [${requestId}] Token exchange successful:`, {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    });

    // Test the YouTube API to get channel info with retry mechanism
    let channelResponse;
    let channelAttempt = 1;
    const maxChannelAttempts = 2;
    let channelName = 'YouTube Channel';

    while (channelAttempt <= maxChannelAttempts) {
      console.log(`🔄 [${requestId}] YouTube API verification attempt ${channelAttempt}/${maxChannelAttempts}`);
      
      try {
        channelResponse = await fetch(
          'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
          {
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Accept': 'application/json',
            },
          }
        );

        console.log(`📡 [${requestId}] YouTube API response status:`, channelResponse.status);

        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          channelName = channelData.items?.[0]?.snippet?.title || 'YouTube Channel';
          console.log(`📺 [${requestId}] YouTube channel verified:`, channelName);
          break; // Success, exit retry loop
        } else {
          const errorText = await channelResponse.text();
          console.error(`❌ [${requestId}] YouTube API test failed (attempt ${channelAttempt}):`, {
            status: channelResponse.status,
            statusText: channelResponse.statusText,
            response: errorText,
          });
          
          // Don't fail the entire flow if we can't get channel info
          if (channelAttempt === maxChannelAttempts) {
            console.warn(`⚠️ [${requestId}] Could not verify YouTube channel, continuing with default name`);
            break;
          }
        }
      } catch (channelError) {
        console.error(`❌ [${requestId}] YouTube API fetch error (attempt ${channelAttempt}):`, channelError);
        if (channelAttempt === maxChannelAttempts) {
          console.warn(`⚠️ [${requestId}] Could not verify YouTube channel, continuing with default name`);
          break;
        }
      }
      
      channelAttempt++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Calculate expiration date
    let expirationDate = null;
    if (tokenData.expires_in) {
      expirationDate = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    }

    // Store the YouTube connection in the database with retry mechanism
    let dbAttempt = 1;
    const maxDbAttempts = 3;
    let socialToken;

    while (dbAttempt <= maxDbAttempts) {
      console.log(`🔄 [${requestId}] Database save attempt ${dbAttempt}/${maxDbAttempts}`);
      
      try {
        const { data, error: dbError } = await supabaseClient
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
          console.error(`❌ [${requestId}] Database error (attempt ${dbAttempt}):`, dbError);
          
          if (dbAttempt === maxDbAttempts) {
            return new Response(
              JSON.stringify({ 
                error: 'Failed to save connection', 
                details: dbError.message 
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        } else {
          socialToken = data;
          console.log(`✅ [${requestId}] YouTube connection saved successfully:`, {
            id: socialToken?.id,
            platform: socialToken?.platform,
            username: socialToken?.username,
          });
          break; // Success, exit retry loop
        }
      } catch (dbSaveError) {
        console.error(`❌ [${requestId}] Database save fetch error (attempt ${dbAttempt}):`, dbSaveError);
        
        if (dbAttempt === maxDbAttempts) {
          return new Response(
            JSON.stringify({ 
              error: 'Database connection error', 
              details: dbSaveError instanceof Error ? dbSaveError.message : 'Unknown error'
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }
      
      dbAttempt++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Redirect to app page on the main domain
    const redirectUrl = `https://clipandship.ca/#/app?youtube=connected&timestamp=${Date.now()}`;
    
    console.log(`🎉 [${requestId}] OAuth flow completed successfully, redirecting to:`, redirectUrl);
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': redirectUrl,
      },
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Unexpected error:`, {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId: requestId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});