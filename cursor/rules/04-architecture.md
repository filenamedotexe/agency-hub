# Architecture

## Database Schema

```sql
-- Core tables structure
users (id, email, role, profile_data)
clients (id, name, business_name, duda_site_id, address, metadata)
service_templates (id, name, type, default_tasks, price, checklist)
services (id, template_id, client_id, status, custom_tasks)
tasks (id, service_id, name, description, due_date, client_visible, status, checklist)
forms (id, name, schema, settings, service_id, created_by)
form_responses (id, form_id, client_id, response_data, submitted_at)
requests (id, client_id, description, status, duda_data, client_visible, created_at)
request_comments (id, request_id, text, duda_uuid, is_deleted, created_at)
activity_logs (id, user_id, entity_type, entity_id, action, metadata)
attachments (id, entity_type, entity_id, file_path, file_size, mime_type, metadata)
api_keys (id, service, encrypted_key, last_four, created_by)
content_tools (id, type, name, description, prompt, webhook_id, fields)
generated_content (id, tool_id, client_id, prompt, content, metadata, created_by)
webhooks (id, name, url, production_url, testing_url, is_production, type, entity_id, headers, is_active)
webhook_executions (id, webhook_id, payload, response, status_code, error)

-- Key Features
- Tasks include checklist field for internal tracking (never visible to clients)
- Content tools support AI generation with metadata tracking
- Generated content is stored with full client/tool association
- Enhanced webhook system with execution tracking and dual URL support
- Comprehensive attachment system with metadata
- Realtime subscriptions enabled for requests, request_comments, and dashboard updates

-- Relationships
- One client → many forms, services, requests, generated_content
- One client → many services
- One service → many tasks (tasks cannot exist without services)
- Forms can attach to services OR directly to clients
- Content tools → many generated_content entries
- Webhooks → many webhook_executions
```

## Realtime Features

### Dashboard Realtime Updates

- **Tables Monitored**: `clients`, `services`, `requests`, `activity_logs`
- **Implementation**: `useRealtimeDashboard()` hook automatically invalidates dashboard stats when data changes
- **User Experience**: Dashboard statistics update instantly without page refresh

### Requests Realtime Updates

- **Tables Monitored**: `requests`, `request_comments`
- **Implementation**: `useRealtimeRequests()` hook with callback functions for different events
- **Features**:
  - New request notifications with toast alerts
  - Live request status updates
  - Real-time comment additions
  - Automatic UI updates without refresh

### Database Setup

```sql
-- Enable realtime for requests table
ALTER PUBLICATION supabase_realtime ADD TABLE requests;
ALTER PUBLICATION supabase_realtime ADD TABLE request_comments;

-- Grant necessary permissions
GRANT SELECT ON requests TO authenticated;
GRANT SELECT ON request_comments TO authenticated;
```

## API Endpoints

### Core APIs

- `/api/clients` - Client management
- `/api/services` - Service templates and assignments
- `/api/forms` - Form builder and responses
- `/api/requests` - Request management
- `/api/content-tools` - AI content generation
- `/api/settings` - Application settings

### Webhook APIs

- `/api/webhooks` - Webhook CRUD operations
- `/api/webhooks/[id]` - Individual webhook management
- `/api/webhooks/execute` - Execute webhook programmatically
- `/api/test-webhook` - Test webhook endpoints
- `/api/webhooks/duda` - Duda webhook receiver

### Content Tool APIs

- `/api/content-tools/[id]/generate` - Generate content with AI
- `/api/content-tools/[id]/generated-content` - Retrieve generated content (with optional client filtering)
- `/api/content-tools/[id]/callback` - Webhook callback endpoint

### Utility APIs

- `/api/health` - Health check endpoint
- `/api/debug/current-user` - Debug current user info
- `/api/debug/role` - Debug role information

## Folder Structure

```
/src
  /app                    # Next.js App Router
    /(auth)              # Auth pages (login, signup, etc)
    /(dashboard)         # Protected dashboard routes
      /clients
      /services
      /requests
      /forms
      /content-tools
      /settings
    /api                 # API routes
      /webhooks          # Webhook endpoints
      /content-tools     # Content generation APIs
      /test-webhook      # Webhook testing
  /components
    /ui                  # shadcn/ui components
      /dynamic-field.tsx # Click-to-copy dynamic field component
      /tooltip.tsx       # Radix UI tooltip component for interactive help
    /features            # Feature-specific components
    /layouts             # Layout components
    /content-tools       # Content tool components
  /lib
    /supabase           # Supabase client setup
    /prisma             # Prisma client
    /utils              # Utility functions
    /callback-urls.ts   # Environment-aware callback URL generation
    /hooks              # Custom React hooks
    /validations        # Zod schemas
  /hooks
    /use-realtime-dashboard.ts  # Dashboard realtime updates
    /use-realtime-requests.ts   # Requests realtime updates
  /services             # Business logic
  /types                # TypeScript types
  /tests
    /e2e                # Playwright tests
    /unit               # Unit tests
    /fixtures           # Test data
  /supabase
    /migrations         # Database migrations
```

## Dynamic Fields Schema

```json
// Stored as JSONB in form_responses.response_data
{
  "field_name": {
    "value": "user input",
    "type": "text|number|date|select|file",
    "label": "Display Name"
  }
}
```

## Duda Webhook Integration

### Webhook Events We Handle

- **NEW_CONVERSATION**: Creates new request with 'To Do' status
- **NEW_COMMENT**: Adds to existing request thread
- **CONVERSATION_UPDATED**: Updates request status
- **COMMENT_EDITED**: Updates comment in request
- **COMMENT_DELETED**: Marks comment as deleted

### Webhook Payload Structure

```typescript
interface DudaWebhook {
  data: {
    comment?: { text: string; uuid: string };
    conversation_uuid?: string;
    conversation_context?: {
      page_uuid: string;
      device: "DESKTOP" | "TABLET" | "MOBILE";
      conversation_number: number;
    };
  };
  source: { type: "EDITOR" | "API"; account_name: string };
  resource_data: { site_name: string }; // Maps to duda_site_id
  event_timestamp: number;
  event_type: string;
}
```
