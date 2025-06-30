
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
      video_idea_id, 
      approved, 
      rejection_reason, 
      social_accounts, 
      selected_platforms 
    } = await req.json();

    if (!video_idea_id || typeof approved !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: video_idea_id and approved' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the video idea to check current status
    const { data: videoIdea, error: fetchError } = await supabase
      .from('video_ideas')
      .select('*')
      .eq('id', video_idea_id)
      .single();

    if (fetchError || !videoIdea) {
      throw new Error('Video idea not found');
    }

    if (approved) {
      console.log(`Approving video ${video_idea_id} for publishing`);
      
      // Update status to approved and publishing
      const { error: updateError } = await supabase
        .from('video_ideas')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          status: 'publishing'
        })
        .eq('id', video_idea_id);

      if (updateError) throw updateError;

      // Trigger publishing workflow via N8N webhook
      const webhookUrl = Deno.env.get("VIDEO_GENERATION_WEBHOOK_URL");
      if (webhookUrl) {
        const publishPayload: any = {
          phase: 'publish',
          video_idea_id: video_idea_id,
          video_idea: videoIdea.idea_text,
          selected_platforms: selected_platforms || videoIdea.selected_platforms,
          video_url: videoIdea.video_url || videoIdea.preview_video_url,
          approved: true
        };

        // Add social accounts if provided (new workflow)
        if (social_accounts) {
          publishPayload.social_accounts = social_accounts;
          console.log('Sending social accounts to n8n:', Object.keys(social_accounts));
        }

        // Add platform-specific titles and metadata
        if (videoIdea.caption) publishPayload.caption = videoIdea.caption;
        if (videoIdea.youtube_title) publishPayload.youtube_title = videoIdea.youtube_title;
        if (videoIdea.tiktok_title) publishPayload.tiktok_title = videoIdea.tiktok_title;
        if (videoIdea.instagram_title) publishPayload.instagram_title = videoIdea.instagram_title;

        const publishResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(publishPayload),
        });

        console.log(`Publishing webhook triggered with status: ${publishResponse.status}`);
        
        if (!publishResponse.ok) {
          console.error('Publishing webhook failed:', await publishResponse.text());
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Video approved and publishing initiated' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      console.log(`Rejecting video ${video_idea_id}`);
      
      // Update status to rejected
      const { error: updateError } = await supabase
        .from('video_ideas')
        .update({
          approval_status: 'rejected',
          rejected_reason: rejection_reason || 'Not approved by user',
          status: 'rejected'
        })
        .eq('id', video_idea_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Video rejected successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in approve-video function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
