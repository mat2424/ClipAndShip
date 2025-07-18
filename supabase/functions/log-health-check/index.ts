import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { status, response_time_ms, error_message, source = 'n8n', metadata = {} } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log the health check result
    const { data, error } = await supabase
      .from('health_check_logs')
      .insert({
        status,
        response_time_ms,
        error_message,
        source,
        metadata
      });

    if (error) {
      console.error('Failed to log health check:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log health check' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📊 Health check logged: ${status} (${response_time_ms}ms)`);

    return new Response(
      JSON.stringify({ success: true, message: 'Health check logged successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in log-health-check function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to log health check', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});