import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramUploadPayload {
  video_idea_id: string;
  video_url: string;
  caption: string;
  access_token: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: InstagramUploadPayload = await req.json();
    console.log('📸 Instagram upload request:', { video_idea_id: payload.video_idea_id });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update upload status to uploading
    await supabase
      .from('video_ideas')
      .update({
        upload_status: { instagram: 'uploading' },
        upload_progress: { instagram: 0 }
      })
      .eq('id', payload.video_idea_id);

    // Upload to Instagram
    const uploadResponse = await uploadToInstagram({
      videoUrl: payload.video_url,
      caption: payload.caption,
      accessToken: payload.access_token,
      userId: payload.user_id
    });

    if (uploadResponse.success) {
      // Update database with success
      await supabase
        .from('video_ideas')
        .update({
          upload_status: { instagram: 'completed' },
          upload_progress: { instagram: 100 },
          instagram_media_id: uploadResponse.mediaId,
          instagram_link: uploadResponse.permalink
        })
        .eq('id', payload.video_idea_id);

      console.log('✅ Instagram upload successful:', uploadResponse.mediaId);
    } else {
      throw new Error(uploadResponse.error || 'Upload failed');
    }

    return new Response(
      JSON.stringify({ success: true, mediaId: uploadResponse.mediaId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Instagram upload error:', error);
    
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
          upload_status: { instagram: 'failed' },
          upload_errors: { instagram: error.message }
        })
        .eq('id', payload.video_idea_id);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function uploadToInstagram({ videoUrl, caption, accessToken, userId }: {
  videoUrl: string;
  caption: string;
  accessToken: string;
  userId: string;
}) {
  try {
    // Step 1: Create media container for Reel
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: videoUrl,
          caption: caption,
          access_token: accessToken
        })
      }
    );

    if (!containerResponse.ok) {
      const errorText = await containerResponse.text();
      console.error('Instagram container error:', errorText);
      return { success: false, error: `Media container creation failed: ${errorText}` };
    }

    const containerResult = await containerResponse.json();
    const creationId = containerResult.id;

    // Step 2: Check upload status
    let uploadComplete = false;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max wait

    while (!uploadComplete && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await fetch(
        `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${accessToken}`
      );

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        if (statusResult.status_code === 'FINISHED') {
          uploadComplete = true;
        } else if (statusResult.status_code === 'ERROR') {
          return { success: false, error: 'Video processing failed' };
        }
      }
      
      attempts++;
    }

    if (!uploadComplete) {
      return { success: false, error: 'Upload timeout - video processing took too long' };
    }

    // Step 3: Publish the media
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media_publish`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken
        })
      }
    );

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error('Instagram publish error:', errorText);
      return { success: false, error: `Media publish failed: ${errorText}` };
    }

    const publishResult = await publishResponse.json();
    const mediaId = publishResult.id;

    // Get permalink
    const permalinkResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}?fields=permalink&access_token=${accessToken}`
    );

    let permalink = '';
    if (permalinkResponse.ok) {
      const permalinkResult = await permalinkResponse.json();
      permalink = permalinkResult.permalink || '';
    }

    return { 
      success: true, 
      mediaId: mediaId,
      permalink: permalink
    };

  } catch (error) {
    console.error('Instagram upload exception:', error);
    return { success: false, error: error.message };
  }
}