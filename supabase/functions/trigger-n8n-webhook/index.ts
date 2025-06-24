
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { video_idea_id, status, video_url, webhook_url } = await req.json();

    if (!webhook_url) {
      return new Response(
        JSON.stringify({ error: 'No webhook URL provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Trigger the n8n webhook with video processing status
    const webhookResponse = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_idea_id,
        status,
        video_url: video_url || null,
        timestamp: new Date().toISOString(),
        event: 'video_status_update'
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    console.log('n8n webhook triggered successfully for video:', video_idea_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook triggered successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error triggering n8n webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to trigger webhook', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
