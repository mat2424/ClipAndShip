
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      user_id, 
      platform, 
      access_token, 
      refresh_token, 
      expires_in 
    } = await req.json();

    console.log('Received OAuth callback:', { user_id, platform, expires_in });

    if (!user_id || !platform || !access_token) {
      throw new Error('Missing required fields: user_id, platform, access_token');
    }

    // Calculate expiration date if expires_in is provided
    let expires_at = null;
    if (expires_in) {
      expires_at = new Date(Date.now() + expires_in * 1000).toISOString();
    }

    // Store or update the social token
    const { data, error } = await supabase
      .from('social_tokens')
      .upsert(
        {
          user_id,
          platform,
          access_token,
          refresh_token,
          expires_at,
        },
        {
          onConflict: 'user_id,platform'
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error storing social token:', error);
      throw error;
    }

    console.log('Successfully stored social token:', data);

    return new Response(
      JSON.stringify({ success: true, message: 'OAuth token stored successfully' }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
})
