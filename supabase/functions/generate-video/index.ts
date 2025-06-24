
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_idea_id, video_idea, selected_platforms, use_ai_voice, voice_file_url } = await req.json();

    // Get the webhook URL from secrets
    const webhookUrl = Deno.env.get("VIDEO_GENERATION_WEBHOOK_URL");
    if (!webhookUrl) {
      throw new Error("VIDEO_GENERATION_WEBHOOK_URL not configured");
    }

    console.log("Calling video generation webhook:", webhookUrl);

    // Call the external webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        video_idea,
        selected_platforms
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    const webhookData = await webhookResponse.json();
    console.log("Webhook response:", webhookData);

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update the video idea with the response data
    const { error: updateError } = await supabase
      .from('video_ideas')
      .update({
        status: 'completed',
        video_url: webhookData.video_file || null,
        youtube_link: webhookData.youtube_link || null,
        instagram_link: webhookData.instagram_link || null,
        tiktok_link: webhookData.tiktok_link || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', video_idea_id);

    if (updateError) {
      console.error("Error updating video idea:", updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, data: webhookData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in generate-video function:", error);
    
    // If we have a video_idea_id, mark it as failed
    if (req.body && JSON.parse(await req.text()).video_idea_id) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );
        
        await supabase
          .from('video_ideas')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', JSON.parse(await req.text()).video_idea_id);
      } catch (updateError) {
        console.error("Error updating failed status:", updateError);
      }
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
