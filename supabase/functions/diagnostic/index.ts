import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Log incoming request for audit purposes
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    console.log(`🩺 Diagnostic Request - ${timestamp}`, {
      method,
      url,
      userAgent,
      ip,
      timestamp
    });

    // Check if this is a health check request
    if (req.method === 'GET' || req.method === 'POST') {
      // Parse any body data for logging
      let requestBody = null;
      if (req.method === 'POST') {
        try {
          requestBody = await req.json();
          console.log(`📋 Request body:`, requestBody);
        } catch (error) {
          console.log(`⚠️ Could not parse request body:`, error.message);
        }
      }

      // Respond instantly with status OK
      const response = {
        status: "ok",
        timestamp,
        message: "Supabase Edge Function is responding correctly",
        metadata: {
          function: "diagnostic",
          version: "1.0.0",
          environment: Deno.env.get("SUPABASE_URL") ? "production" : "development",
          region: Deno.env.get("DENO_REGION") || "unknown"
        }
      };

      console.log(`✅ Health check successful - responding with:`, response);

      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // Handle unsupported methods
    console.log(`❌ Unsupported method: ${method}`);
    return new Response(
      JSON.stringify({
        status: "error",
        message: `Method ${method} not supported`,
        timestamp
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error(`💥 Diagnostic function error:`, error);
    
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Internal server error",
        timestamp: new Date().toISOString(),
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});