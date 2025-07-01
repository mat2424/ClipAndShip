
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

      // Send approval to your n8n workflow
      const approvalWebhookUrl = 'https://kazzz24.app.n8n.cloud/webhook/video-approval-response';
      
      const approvalPayload = {
        video_idea_id: video_idea_id,
        approved: true,
        video_url: videoIdea.video_url,
        idea: videoIdea.idea_text,
        caption: videoIdea.caption,
        youtube_title: videoIdea.youtube_title,
        tiktok_title: videoIdea.tiktok_title,
        instagram_title: videoIdea.instagram_title,
        selected_platforms: selected_platforms || videoIdea.selected_platforms,
        social_accounts: social_accounts || {}
      };

      const approvalResponse = await fetch(approvalWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalPayload),
      });

      console.log(`Approval webhook triggered with status: ${approvalResponse.status}`);
      
      if (!approvalResponse.ok) {
        console.error('Approval webhook failed:', await approvalResponse.text());
      }

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

      // Send rejection to your n8n workflow
      const approvalWebhookUrl = 'https://kazzz24.app.n8n.cloud/webhook/video-approval-response';
      
      const rejectionPayload = {
        video_idea_id: video_idea_id,
        approved: false,
        rejection_reason: rejection_reason || 'Not approved by user'
      };

      const rejectionResponse = await fetch(approvalWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionPayload),
      });

      console.log(`Rejection webhook triggered with status: ${rejectionResponse.status}`);

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
