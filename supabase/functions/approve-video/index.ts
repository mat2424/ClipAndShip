
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

      // Process video uploads directly instead of sending to n8n
      const uploadResponse = await supabase.functions.invoke('process-video-uploads', {
        body: {
          video_idea_id: video_idea_id,
          video_url: videoIdea.video_url,
          selected_platforms: selected_platforms || videoIdea.selected_platforms,
          social_accounts: social_accounts || {},
          metadata: {
            youtube_title: videoIdea.youtube_title,
            tiktok_title: videoIdea.tiktok_title,
            instagram_title: videoIdea.instagram_title,
            caption: videoIdea.caption
          }
        }
      });

      if (uploadResponse.error) {
        console.error('Upload processing failed:', uploadResponse.error);
        // Update status to failed
        await supabase
          .from('video_ideas')
          .update({
            status: 'failed',
            approval_status: 'failed'
          })
          .eq('id', video_idea_id);
      }

      console.log('✅ Upload processing initiated successfully');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Video approved and sent to n8n workflow for publishing' 
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

      console.log(`✅ Video rejected successfully`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Video rejected and n8n workflow notified' 
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
