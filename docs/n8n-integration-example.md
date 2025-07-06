# n8n YouTube Integration Example

This document shows how to integrate with the YouTube uploader using n8n workflows.

## Webhook Endpoint

```
POST https://your-project.supabase.co/functions/v1/n8n-youtube-webhook
```

## Headers (Optional but Recommended)

```
Content-Type: application/json
X-Webhook-Secret: your-webhook-secret-here
```

## Request Payload

```json
{
  "user_id": "uuid-of-the-user",
  "video_url": "https://example.com/path/to/video.mp4",
  "title": "My Amazing Video Title",
  "description": "This is the video description with details about the content.",
  "tags": ["shorts", "ai", "viral", "custom-tag"],
  "privacy_status": "public",
  "is_short": true,
  "webhook_id": "optional-unique-identifier",
  "metadata": {
    "campaign_id": "summer-2024",
    "source": "automated-content-generator"
  }
}
```

## Field Descriptions

- **user_id** (required): UUID of the authenticated user who connected their YouTube account
- **video_url** (required): Direct URL to the video file to upload
- **title** (required): Video title (max 100 characters, will be truncated if longer)
- **description** (optional): Video description text
- **tags** (optional): Array of tags for the video (default: ["shorts", "automated"]) 
- **privacy_status** (optional): "public", "private", or "unlisted" (default: "public")
- **is_short** (optional): Boolean indicating if this is a YouTube Short (default: true)
- **webhook_id** (optional): Custom identifier for tracking the webhook
- **metadata** (optional): Additional data for your records

## Response

### Success Response (200)
```json
{
  "success": true,
  "webhook_id": "abc12345",
  "video_id": "dQw4w9WgXcQ",
  "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "upload_status": "completed",
  "message": "Video uploaded successfully to YouTube"
}
```

### Error Responses

#### User Not Connected (403)
```json
{
  "error": "User not connected to YouTube",
  "requires_auth": true,
  "user_id": "uuid-here"
}
```

#### Missing Fields (400)
```json
{
  "error": "Missing required fields: user_id, video_url, title"
}
```

#### Upload Failed (500)
```json
{
  "error": "Upload failed",
  "details": "Token expired or invalid",
  "webhook_id": "abc12345"
}
```

## n8n Workflow Example

Here's a basic n8n workflow setup:

### 1. HTTP Request Node (to YouTube Webhook)
```
Method: POST
URL: https://your-project.supabase.co/functions/v1/n8n-youtube-webhook
Headers: 
  Content-Type: application/json
  X-Webhook-Secret: {{ $env.YOUTUBE_WEBHOOK_SECRET }}

Body:
{
  "user_id": "{{ $json.user_id }}",
  "video_url": "{{ $json.generated_video_url }}",
  "title": "{{ $json.video_title }}",
  "description": "{{ $json.video_description }}",
  "tags": {{ $json.tags }},
  "privacy_status": "public",
  "is_short": true
}
```

### 2. Error Handling Node
Add a node to handle different response codes:

```javascript
// Check if upload was successful
if ($json.success) {
  return {
    status: 'success',
    video_url: $json.video_url,
    video_id: $json.video_id
  };
} else if ($json.requires_auth) {
  return {
    status: 'auth_required',
    user_id: $json.user_id,
    message: 'User needs to reconnect YouTube account'
  };
} else {
  return {
    status: 'error',
    error: $json.error,
    details: $json.details
  };
}
```

## Environment Variables

Set these in your Supabase Edge Functions secrets:

- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret  
- `N8N_WEBHOOK_SECRET`: Optional webhook secret for security

## Security Notes

1. **Webhook Secret**: Use the `X-Webhook-Secret` header to verify legitimate requests
2. **User Validation**: The system automatically validates that the user_id has valid YouTube tokens
3. **Token Refresh**: Expired access tokens are automatically refreshed using stored refresh tokens
4. **Rate Limits**: YouTube API has quota limits - monitor your usage in Google Cloud Console

## Testing

You can test the webhook using curl:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/n8n-youtube-webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{
    "user_id": "test-user-uuid",
    "video_url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    "title": "Test Upload via Webhook",
    "description": "This is a test upload",
    "is_short": true
  }'
```

## Monitoring

All webhook calls are logged in the `webhook_logs` table for debugging and monitoring purposes. You can query this table to track:

- Successful uploads
- Failed uploads with error details  
- Processing times
- User activity patterns