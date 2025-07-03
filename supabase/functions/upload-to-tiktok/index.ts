import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TikTokUploadPayload {
  video_idea_id: string;
  video_url: string;
  title: string;
  description: string;
  access_token: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: TikTokUploadPayload = await req.json();
    console.log('🎵 TikTok upload request:', { video_idea_id: payload.video_idea_id });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get video idea to check user tier
    const { data: videoIdea, error: fetchError } = await supabase
      .from('video_ideas')
      .select('user_id')
      .eq('id', payload.video_idea_id)
      .single();

    if (fetchError || !videoIdea) {
      throw new Error('Video idea not found');
    }

    // Check user tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', videoIdea.user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    if (profile.subscription_tier === 'free') {
      throw new Error('TikTok uploads require a premium subscription');
    }

    // Update upload status to uploading
    await supabase
      .from('video_ideas')
      .update({
        upload_status: { tiktok: 'uploading' },
        upload_progress: { tiktok: 0 }
      })
      .eq('id', payload.video_idea_id);

    // Download video from URL
    console.log('📥 Downloading video from:', payload.video_url);
    const videoResponse = await fetch(payload.video_url);
    if (!videoResponse.ok) {
      throw new Error('Failed to download video');
    }
    const videoBlob = await videoResponse.blob();
    
    // Upload to TikTok
    const uploadResponse = await uploadToTikTok({
      videoBlob,
      title: payload.title,
      description: payload.description,
      accessToken: payload.access_token
    });

    if (uploadResponse.success) {
      // Update database with success
      await supabase
        .from('video_ideas')
        .update({
          upload_status: { tiktok: 'completed' },
          upload_progress: { tiktok: 100 },
          tiktok_video_id: uploadResponse.videoId,
          tiktok_link: uploadResponse.shareUrl
        })
        .eq('id', payload.video_idea_id);

      console.log('✅ TikTok upload successful:', uploadResponse.videoId);
    } else {
      throw new Error(uploadResponse.error || 'Upload failed');
    }

    return new Response(
      JSON.stringify({ success: true, videoId: uploadResponse.videoId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 TikTok upload error:', error);
    
    // Update database with error
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const payload = await req.json().catch(() => ({}));
    if (payload.video_idea_id) {
      await supabase
        .from('video_ideas')
        .update({
          upload_status: { tiktok: 'failed' },
          upload_errors: { tiktok: error.message }
        })
        .eq('id', payload.video_idea_id);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function uploadToTikTok({ videoBlob, title, description, accessToken }: {
  videoBlob: Blob;
  title: string;
  description: string;
  accessToken: string;
}) {
  try {
    const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
    if (!clientKey) {
      return { success: false, error: 'TikTok client key not configured' };
    }

    // Step 1: Initialize upload
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: title,
          description: description,
          privacy_level: "SELF_ONLY", // Start with private, can be changed later
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoBlob.size,
          chunk_size: videoBlob.size,
          total_chunk_count: 1
        }
      })
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('TikTok init error:', errorText);
      return { success: false, error: `Upload initialization failed: ${errorText}` };
    }

    const initResult = await initResponse.json();
    const publishId = initResult.data.publish_id;
    const uploadUrl = initResult.data.upload_url;

    // Step 2: Upload video file
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes 0-${videoBlob.size - 1}/${videoBlob.size}`,
        'Content-Type': 'video/mp4'
      },
      body: videoBlob
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('TikTok upload error:', errorText);
      return { success: false, error: `Video upload failed: ${errorText}` };
    }

    // Step 3: Commit the upload
    const commitResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/commit/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        publish_id: publishId
      })
    });

    if (!commitResponse.ok) {
      const errorText = await commitResponse.text();
      console.error('TikTok commit error:', errorText);
      return { success: false, error: `Upload commit failed: ${errorText}` };
    }

    const commitResult = await commitResponse.json();
    
    return { 
      success: true, 
      videoId: publishId,
      shareUrl: commitResult.data?.share_url || `https://www.tiktok.com/`
    };

  } catch (error) {
    console.error('TikTok upload exception:', error);
    return { success: false, error: error.message };
  }
}