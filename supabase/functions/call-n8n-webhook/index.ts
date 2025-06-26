
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
    const { 
      phase, 
      video_idea_id, 
      video_idea, 
      selected_platforms, 
      use_ai_voice, 
      preview_video_url 
    } = await req.json();

    console.log(`🎬 N8N Webhook called for ${phase} phase`, {
      video_idea_id,
      video_idea: video_idea?.substring(0, 50) + '...',
      selected_platforms,
      phase
    });

    // Get the webhook URL from environment
    const webhookUrl = Deno.env.get("VIDEO_GENERATION_WEBHOOK_URL");
    if (!webhookUrl) {
      throw new Error("VIDEO_GENERATION_WEBHOOK_URL not configured");
    }

    // Prepare the payload based on the phase
    let payload;
    if (phase === 'preview') {
      // Phase 1: Generate preview
      payload = {
        phase: 'preview',
        video_idea_id,
        video_idea,
        selected_platforms,
        use_ai_voice: use_ai_voice || true
      };
    } else if (phase === 'publish') {
      // Phase 2: Publish to platforms
      payload = {
        phase: 'publish',
        video_idea_id,
        video_idea,
        selected_platforms,
        preview_video_url
      };
    } else {
      throw new Error(`Invalid phase: ${phase}. Must be 'preview' or 'publish'`);
    }

    console.log("🚀 Calling N8N webhook:", webhookUrl);
    console.log("📦 Payload:", payload);

    // Call the N8N webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ N8N webhook failed (${response.status}):`, errorText);
      throw new Error(`N8N webhook failed with status: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("✅ N8N webhook success:", responseData);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("💥 Error in call-n8n-webhook:", error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook call failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
