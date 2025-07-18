
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalNotificationPayload {
  video_idea_id: string;
  status: 'upload_complete' | 'upload_failed' | 'rejected';
  platform_links?: {
    youtube?: string;
    instagram?: string;
    tiktok?: string;
  };
  error_message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: ApprovalNotificationPayload = await req.json();
    console.log('📬 Approval response notification received:', payload);

    if (!payload.video_idea_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: video_idea_id' }),
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

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (payload.status) {
      case 'upload_complete':
        updateData = {
          ...updateData,
          approval_status: 'published',
          status: 'published',
          youtube_link: payload.platform_links?.youtube || null,
          instagram_link: payload.platform_links?.instagram || null,
          tiktok_link: payload.platform_links?.tiktok || null,
        };
        console.log('✅ Video upload completed successfully');
        break;

      case 'upload_failed':
        updateData = {
          ...updateData,
          approval_status: 'failed',
          status: 'failed',
          rejected_reason: payload.error_message || 'Upload failed'
        };
        console.log('❌ Video upload failed');
        break;

      case 'rejected':
        updateData = {
          ...updateData,
          approval_status: 'rejected',
          status: 'rejected'
        };
        console.log('🚫 Video was rejected');
        break;

      default:
        throw new Error(`Unknown status: ${payload.status}`);
    }

    // Update the video_ideas record
    const { error: updateError } = await supabase
      .from('video_ideas')
      .update(updateData)
      .eq('id', payload.video_idea_id);

    if (updateError) {
      console.error('❌ Error updating video idea:', updateError);
      throw updateError;
    }

    console.log('✅ Video idea updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Approval response processed successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Error processing approval response:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Approval response processing failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
