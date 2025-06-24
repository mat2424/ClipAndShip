
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('Received request to call n8n webhook');
    
    const { video_idea, selected_platforms, use_ai_voice } = await req.json();
    
    console.log('Request data:', { video_idea, selected_platforms, use_ai_voice });

    // Call the n8n webhook
    const webhookUrl = "https://kazzz24.app.n8n.cloud/webhook-test/9a1ec0db-1b93-4c5e-928f-a003ece93ba9";
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_idea,
        selected_platforms,
        use_ai_voice
      }),
    });

    if (!response.ok) {
      console.error(`Webhook returned status: ${response.status}`);
      throw new Error(`Webhook returned status: ${response.status}`);
    }

    const webhookData = await response.json();
    console.log('Webhook response:', webhookData);

    return new Response(
      JSON.stringify(webhookData),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error calling webhook:', error);
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
