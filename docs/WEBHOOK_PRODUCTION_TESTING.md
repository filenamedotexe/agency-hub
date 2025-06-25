# Production/Testing Webhook URLs

## Overview

The webhook system now supports separate Production and Testing URLs for each webhook, allowing you to easily switch between environments without having to recreate webhooks.

## Features

### 🎯 **Dual URL Support**

- **Production URL**: Your live/production webhook endpoint
- **Testing URL**: Your development/testing webhook endpoint
- **Environment Toggle**: Easy switch between Production and Testing modes
- **Visual Indicators**: Clear badges showing which environment is active

### 🔄 **Environment Switching**

- Toggle switch in webhook creation/editing forms
- Real-time visual feedback with colored borders:
  - **Green border**: Production URL (when Production mode is active)
  - **Blue border**: Testing URL (when Testing mode is active)
- Environment badges throughout the UI

### 📊 **Webhook Execution**

- Content generation automatically uses the appropriate URL based on current environment setting
- Webhook payload includes environment information
- Execution logs track which environment was used

## How to Use

### Creating a New Webhook

1. **Open Content Tools** → Click "Add Webhook" or "Settings" on a content tool
2. **Fill in Webhook Name** (e.g., "My n8n Webhook")
3. **Set Environment URLs**:
   - **Production URL**: `https://your-production-n8n.com/webhook/content`
   - **Testing URL**: `https://your-testing-n8n.com/webhook/content`
4. **Choose Active Environment**: Use the toggle switch
   - **Production** (default): Badge shows "Production", green border on Production URL
   - **Testing**: Badge shows "Testing", blue border on Testing URL
5. **Add Custom Headers** (optional): JSON format for authentication
6. **Create Webhook**

### Environment Toggle

The environment toggle allows you to switch between Production and Testing modes:

```
Production [●○] Testing
```

- **Left position (Production)**: Uses Production URL
- **Right position (Testing)**: Uses Testing URL

### Visual Indicators

#### Webhook Creation Form

- **Environment Badge**: Shows current mode (Production/Testing)
- **URL Field Borders**:
  - Green border on Production URL when Production is active
  - Blue border on Testing URL when Testing is active

#### Webhook List

- **Environment Badge**: Each webhook shows its current environment
- **URL Display**: Shows the currently active URL

## Webhook Payload

When content is generated, the webhook receives this data structure:

```json
{
  "toolId": "content-tool-id",
  "toolName": "Blog Writer",
  "clientId": "client-id",
  "clientName": "Client Business Name",
  "content": "Generated content...",
  "variables": {
    "businessName": "Client Business",
    "clientName": "John Doe",
    "topic": "AI Marketing"
  },
  "generatedAt": "2025-01-28T10:30:00Z",
  "environment": "production" // NEW: Shows which environment was used
}
```

## Database Schema

The webhook table now includes:

```sql
-- New fields added to webhooks table
productionUrl  String?   -- Production webhook URL
testingUrl     String?   -- Testing webhook URL
isProduction   Boolean   -- Which environment is active (default: true)
```

## API Changes

### POST /api/webhooks

**Request Body:**

```json
{
  "name": "My Webhook",
  "url": "https://active-url.com/webhook", // Still required for backwards compatibility
  "productionUrl": "https://prod.com/webhook",
  "testingUrl": "https://test.com/webhook",
  "isProduction": true,
  "type": "CONTENT_TOOL",
  "headers": {},
  "isActive": true
}
```

## Use Cases

### 1. **Development Workflow**

- Set up testing webhook pointing to local n8n instance
- Set up production webhook pointing to live n8n instance
- Toggle between environments during development and testing

### 2. **Client Staging**

- Use testing environment for client review and approval
- Switch to production for final content delivery

### 3. **A/B Testing**

- Test different webhook endpoints or configurations
- Easy switching without losing webhook configuration

## Best Practices

1. **Always set both URLs** when creating webhooks
2. **Use descriptive names** that indicate the webhook's purpose
3. **Test in Testing environment** before switching to Production
4. **Monitor webhook executions** in both environments
5. **Use consistent authentication** across both environments

## Migration Notes

- **Existing webhooks**: Will continue to work with their current URL
- **New webhooks**: Should set both Production and Testing URLs
- **Environment field**: Defaults to Production mode for new webhooks
- **Backwards compatibility**: The original `url` field is still used as fallback

## Troubleshooting

### Webhook Not Firing

1. Check if webhook is **Active**
2. Verify the correct **environment URL** is set
3. Check **environment toggle** is set correctly
4. Review **webhook execution logs** for errors

### Wrong Environment

1. Check the **environment badge** on the webhook
2. Use the **toggle switch** to change environments
3. Verify the **URL borders** show the correct active environment

### URL Not Working

1. Test the webhook URL manually with a tool like Postman
2. Check **Custom Headers** are correctly formatted
3. Verify **n8n workflow** is active and accessible
4. Check **network connectivity** to the webhook endpoint
