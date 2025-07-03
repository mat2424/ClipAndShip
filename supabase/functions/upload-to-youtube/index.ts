import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YouTubeUploadPayload {
  video_idea_id: string;
  video_url: string;
  title: string;
  description: string;
  access_token: string;
  refresh_token?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: YouTubeUploadPayload = await req.json();
    console.log('🎬 YouTube upload request:', { video_idea_id: payload.video_idea_id });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update upload status to uploading
    await supabase
      .from('video_ideas')
      .update({
        upload_status: { youtube: 'uploading' },
        upload_progress: { youtube: 0 }
      })
      .eq('id', payload.video_idea_id);

    // Download video from URL
    console.log('📥 Downloading video from:', payload.video_url);
    const videoResponse = await fetch(payload.video_url);
    if (!videoResponse.ok) {
      throw new Error('Failed to download video');
    }
    const videoBlob = await videoResponse.blob();
    
    // Upload to YouTube
    const uploadResponse = await uploadToYouTube({
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
          upload_status: { youtube: 'completed' },
          upload_progress: { youtube: 100 },
          youtube_video_id: uploadResponse.videoId,
          youtube_link: `https://www.youtube.com/watch?v=${uploadResponse.videoId}`
        })
        .eq('id', payload.video_idea_id);

      console.log('✅ YouTube upload successful:', uploadResponse.videoId);
    } else {
      throw new Error(uploadResponse.error || 'Upload failed');
    }

    return new Response(
      JSON.stringify({ success: true, videoId: uploadResponse.videoId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 YouTube upload error:', error);
    
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
          upload_status: { youtube: 'failed' },
          upload_errors: { youtube: error.message }
        })
        .eq('id', payload.video_idea_id);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function uploadToYouTube({ videoBlob, title, description, accessToken }: {
  videoBlob: Blob;
  title: string;
  description: string;
  accessToken: string;
}) {
  try {
    // First, initialize the upload
    const metadata = {
      snippet: {
        title: title,
        description: description,
        tags: ["shorts", "ai", "viral"],
        categoryId: "22" // People & Blogs
      },
      status: {
        privacyStatus: "public"
      }
    };

    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': 'video/*'
        },
        body: JSON.stringify(metadata)
      }
    );

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('YouTube init error:', errorText);
      return { success: false, error: `Upload initialization failed: ${errorText}` };
    }

    const uploadUrl = initResponse.headers.get('location');
    if (!uploadUrl) {
      return { success: false, error: 'No upload URL received' };
    }

    // Upload the video file
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*'
      },
      body: videoBlob
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('YouTube upload error:', errorText);
      return { success: false, error: `Video upload failed: ${errorText}` };
    }

    const result = await uploadResponse.json();
    return { success: true, videoId: result.id };

  } catch (error) {
    console.error('YouTube upload exception:', error);
    return { success: false, error: error.message };
  }
}