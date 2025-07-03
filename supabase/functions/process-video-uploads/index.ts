import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://cdn.skypack.dev/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessUploadsPayload {
  video_idea_id: string;
  video_url: string;
  selected_platforms: string[];
  social_accounts: {
    [platform: string]: {
      access_token: string;
      refresh_token?: string;
      user_id?: string;
    };
  };
  metadata: {
    youtube_title?: string;
    tiktok_title?: string;
    instagram_title?: string;
    caption?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: ProcessUploadsPayload = await req.json();
    console.log('🚀 Processing uploads for video:', payload.video_idea_id);

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

    // Filter out premium platforms for free users
    const premiumPlatforms = ['tiktok', 'instagram', 'facebook', 'x', 'linkedin'];
    let allowedPlatforms = payload.selected_platforms;
    
    if (profile.subscription_tier === 'free') {
      const originalCount = allowedPlatforms.length;
      allowedPlatforms = allowedPlatforms.filter(platform => 
        !premiumPlatforms.includes(platform.toLowerCase())
      );
      
      if (allowedPlatforms.length < originalCount) {
        console.log(`🔒 Filtered out premium platforms for free user. Original: ${payload.selected_platforms}, Allowed: ${allowedPlatforms}`);
      }
    }

    if (allowedPlatforms.length === 0) {
      throw new Error('No platforms available for upload with current subscription tier');
    }

    // Initialize upload status for allowed platforms only
    const uploadStatus: { [key: string]: string } = {};
    const uploadProgress: { [key: string]: number } = {};
    
    allowedPlatforms.forEach(platform => {
      uploadStatus[platform.toLowerCase()] = 'pending';
      uploadProgress[platform.toLowerCase()] = 0;
    });

    await supabase
      .from('video_ideas')
      .update({
        upload_status: uploadStatus,
        upload_progress: uploadProgress,
        status: 'uploading'
      })
      .eq('id', payload.video_idea_id);

    // Process uploads for allowed platforms concurrently
    const uploadPromises = allowedPlatforms.map(async (platform) => {
      const platformLower = platform.toLowerCase();
      const account = payload.social_accounts[platformLower];
      
      if (!account) {
        console.error(`No account found for platform: ${platform}`);
        return { platform, success: false, error: 'No account configured' };
      }

      try {
        let result;
        
        switch (platformLower) {
          case 'youtube':
            result = await supabase.functions.invoke('upload-to-youtube', {
              body: {
                video_idea_id: payload.video_idea_id,
                video_url: payload.video_url,
                title: payload.metadata.youtube_title || 'AI Generated Video',
                description: payload.metadata.caption || '',
                access_token: account.access_token,
                refresh_token: account.refresh_token
              }
            });
            break;
            
          case 'tiktok':
            result = await supabase.functions.invoke('upload-to-tiktok', {
              body: {
                video_idea_id: payload.video_idea_id,
                video_url: payload.video_url,
                title: payload.metadata.tiktok_title || 'AI Generated Video',
                description: payload.metadata.caption || '',
                access_token: account.access_token
              }
            });
            break;
            
          case 'instagram':
            result = await supabase.functions.invoke('upload-to-instagram', {
              body: {
                video_idea_id: payload.video_idea_id,
                video_url: payload.video_url,
                caption: payload.metadata.caption || '',
                access_token: account.access_token,
                user_id: account.user_id || ''
              }
            });
            break;
            
          default:
            return { platform, success: false, error: 'Platform not supported' };
        }

        if (result.error) {
          console.error(`Upload failed for ${platform}:`, result.error);
          return { platform, success: false, error: result.error.message };
        }

        console.log(`✅ Upload successful for ${platform}`);
        return { platform, success: true, data: result.data };
        
      } catch (error) {
        console.error(`Upload exception for ${platform}:`, error);
        return { platform, success: false, error: error.message };
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    
    // Check overall success
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    let overallStatus = 'published';
    if (successCount === 0) {
      overallStatus = 'failed';
    } else if (successCount < totalCount) {
      overallStatus = 'partial_success';
    }

    // Update final status
    await supabase
      .from('video_ideas')
      .update({
        status: overallStatus,
        approval_status: overallStatus === 'failed' ? 'failed' : 'published'
      })
      .eq('id', payload.video_idea_id);

    console.log(`📊 Upload summary: ${successCount}/${totalCount} successful`);

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        results: results,
        summary: `${successCount}/${totalCount} uploads successful`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Process uploads error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Upload processing failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});