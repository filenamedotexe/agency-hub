# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

### Overview

- We are building an app for my agency to manage my clients and the services that we offer them.

#### The roles we need

- Admin
  - All permissions
- Service Manager
  - All permissions except settings like webhooks and api keys
- Copywriter
  - Services and tasks assigned to them (w the clients detail page)
- Editor
  - Services and tasks assigned to them (w the clients detail page)
- VA (Virtual Assistant)
- Client
  - 'Client Dashboard', including
    - Forms assigned to the client (To Do, Done)
    - Services for the client & the overall service status
      - Tasks that are added to the service & toggled to be able to viewable by the user

#### Menu Items (pages)

- Dashboard

  - Overview of # of clients, # of services in each status
  - Analytics that are valuable but not just there for the sake of it
  - Activity Log (all)

- Services

  - Create/Edit Templates for services that we can assign to clients
    - Service Name
    - Service attachments (attachments just for the service plus the services from the tasks for this service)
    - Service Type (Google Ads, Facebook Ads, Website Design)
    - Status (To Do, In Progress, Done)
    - Price (It can be single price
    - Service Tasks (Default template tasks, but tasks can be edited/added/removed)
      - Task name
      - Description
      - Due date
      - Attachments (these show up at the task and service level)
      - Toggle whether the client can view it

- Clients

  - List View of all clients
  - Add a new client button
    - Name
    - Address
    - Business Name
    - Duda Site ID (This is how we know who to attach the 'Requests' to.)
  - Client Detail Page (when a client Is clicked) (editable by admin and service manager)
    - Name, Address, Business Name, Duda Site ID
    - Activity Log for the client
    - Form Responses
      - Dynamic Fields & their values

- Requests
  - A request is created when a comment is made in Duda.
    - Duda sends a webhook, webhook gets turned into a 'Request' attached to the client via the unique 'Duda Site ID' as 'To Do' Status
    - Include the comment text & threaded comments where applicable
  - Features
    - Kanban and List View (By Status: To Do, In Progress, Done)
      - Request Date/Time
      - Done Date/Time
    - New Request
      - One off "Request" that's not attached to a service (but its attached to a user, admin & service manager can toggle whether its viewable by the client)
- Forms

  - create/edit forms
  - Forms attach (are correlated to)
    - to a service (which gets assigned/attached to a client)
    - Or Just to a client with no service
  - Full drag and drop form builder with field types
    - Form Settings tab (per each form)
      - Webhook (to send POST request to with the results of the form)
      - URL Redirect (at form completion)
  - Dynamic Fields from form responses
    - The responses to each form get stored as dynamic fields (that can later be used for whatever)
    - These fields show up attached to the client detail page in "Form Responses" section
  - Forms to start with:
    - Onboarding
    - [Google Ads / Google Business / Google Analytics / Google Tag Manager] Onboarding (give it a better name obv)

- Automations

  - WebHooks
    - If a webhook is set for a form, it shows up under "Form Webhooks"
    - If a new webhook is created in webhooks area in automations, it shows up under "General Webhooks" in the webhook area in automations
    - If a webhook is attached to a content tool it shows up under 'Content Tool Webhooks'

- Content Tools

  - This is a separate (in the sense that the tools are isolated from each other) set of "content tools"
  - Each tool has configurable fields that admins can customize:
    - Field visibility toggle (client must fill or admin-only)
    - Field types: text, textarea, number, select
    - Default values can use dynamic fields from forms (e.g., {{businessName}}, {{clientName}})
    - Dynamic fields are organized by form title for easy reference
    - Full field management: add, edit, delete fields through "Edit Fields" dialog
  - **AI-Powered Content Generation**: Tools use AI services (Anthropic Claude, OpenAI) to generate content
    - Supports both API key-based generation and mock generation for testing
    - Processes dynamic field substitution in real-time
    - Content is stored in database with full metadata tracking
  - **Enhanced User Experience**:
    - Click-to-copy dynamic fields throughout the interface
    - Smart notifications for missing client data
    - Dynamic generated content section that updates based on client selection
    - "Just Generated" highlighting for new content
    - Previous generations history with sorting and individual actions
  - **Optional Webhook Integration**: Tools can optionally trigger webhooks after content generation
  - Tools
    - Blog Writer (configurable fields: topic, wordCount, tone, keywords)
    - Facebook Video Ad Script & Caption Writer
    - Facebook Image Ad & Caption Writer
    - Google Search Ad Writer
    - SEO Keyword Research

- Settings
  - Account Settings
  - Api Keys (Anthropic, Open AI)
    - These are also dynamic fields that get passed (optionally) with content tools with the webhook to n8n
  - Add Admins, Service Managers, Copywriters, Editors, VA's

## Tech Stack

### Frontend

- **Next.js 14+** (App Router) - Server components, API routes, excellent DX
- **TypeScript** - Type safety throughout the codebase
- **Tailwind CSS v3 + shadcn/ui** - Rapid UI development with consistent design
  - Note: Must use Tailwind CSS v3 (not v4) for compatibility
- **React Hook Form + Zod** - Form handling with runtime validation
- **TanStack Query** - Server state management, caching, optimistic updates
- **React DnD Kit** - Drag-and-drop for form builder and Kanban
- **Recharts** - Analytics dashboards

### Backend & Database

- **Supabase**
  - PostgreSQL with Row Level Security (RLS)
  - Realtime subscriptions for live updates
  - Storage for file attachments
  - Edge Functions for webhooks
  - Built-in Auth with role management
- **Prisma** - Type-safe ORM

### Testing & Quality

- **Playwright** - E2E testing with headed browser (Next.js on port 3001, Chrome-only for development)
- **Vitest** - Unit and integration testing (not Vite - this is for Next.js)
- **React Testing Library** - Component testing
- **MSW** - API mocking for tests
- **ESLint + Prettier** - Code quality and formatting

## Development Commands

```bash
# Development - PROPER VERIFICATION REQUIRED
pkill -f "next dev"                    # ALWAYS kill existing Next.js processes first
PORT=3001 npm run dev &                # Start Next.js dev server on port 3001 in background
sleep 5                                # Wait for server to start
curl -f http://localhost:3001          # VERIFY server actually responds (REQUIRED)
curl -I http://localhost:3001/login    # VERIFY login page loads (REQUIRED)
# If curl commands fail, server is NOT working - check logs

npm run db:push         # Push Prisma schema to Supabase
npm run db:generate     # Generate Prisma client

# Testing - VERIFY SERVER BEFORE TESTING
curl -f http://localhost:3001/login     # VERIFY server responds before testing
npm run test            # Run unit tests
npm run test:e2e        # Run Playwright tests (headed, port 3001)
npm run test:e2e:ui     # Open Playwright UI mode
npm run test:watch      # Watch mode for unit tests

# Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run type-check      # Run TypeScript compiler

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed test data
npm run db:studio       # Open Prisma Studio

# Build
npm run build           # Build for production
npm run analyze         # Analyze bundle size
```

## Architecture

### Database Schema

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
webhooks (id, name, url, type, entity_id, headers, is_active)
webhook_executions (id, webhook_id, payload, response, status_code, error)

-- New Features
- Tasks include checklist field for internal tracking (never visible to clients)
- Content tools support AI generation with metadata tracking
- Generated content is stored with full client/tool association
- Enhanced webhook system with execution tracking
- Comprehensive attachment system with metadata

-- Relationships
- One client → many forms, services, requests, generated_content
- One client → many services
- One service → many tasks (tasks cannot exist without services)
- Forms can attach to services OR directly to clients
- Content tools → many generated_content entries
- Webhooks → many webhook_executions
```

### Dynamic Fields Schema

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

### Duda Webhook Integration

Webhook events we handle:

- **NEW_CONVERSATION**: Creates new request with 'To Do' status
- **NEW_COMMENT**: Adds to existing request thread
- **CONVERSATION_UPDATED**: Updates request status
- **COMMENT_EDITED**: Updates comment in request
- **COMMENT_DELETED**: Marks comment as deleted

Webhook payload structure:

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

### Folder Structure

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
      /trpc              # tRPC router (optional)
  /components
    /ui                  # shadcn/ui components
    /features            # Feature-specific components
    /layouts             # Layout components
  /lib
    /supabase           # Supabase client setup
    /prisma             # Prisma client
    /utils              # Utility functions
    /hooks              # Custom React hooks
    /validations        # Zod schemas
  /services             # Business logic
  /types                # TypeScript types
  /tests
    /e2e                # Playwright tests
    /unit               # Unit tests
    /fixtures           # Test data
```

### Security Architecture

- **Authentication**: Supabase Auth with JWT
- **Authorization**: Role-based with RLS policies
- **API Security**: Rate limiting, CORS, webhook signatures
- **Data Protection**: Encrypted API keys, secure file storage

#### Critical Middleware Implementation Notes

**IMPORTANT**: Role-based access control in Next.js requires careful implementation to avoid security vulnerabilities:

1. **Middleware Authentication Method**: Always use `supabase.auth.getUser()` in middleware for the most reliable authentication check. This is the official Supabase pattern for server-side authentication verification.

2. **Route Matching Precision**: Be extremely careful with route patterns in middleware. Using `"/"` in publicRoutes will match ALL routes starting with `/`, making every route public. Use exact matching for root paths.

3. **API Route vs Page Route Handling**: Middleware must handle API routes differently from page routes:

   - **API routes**: Return JSON error responses (401/403) for auth failures
   - **Page routes**: Redirect to login page for auth failures
   - Never redirect API routes to login pages (causes CORS issues)

4. **Client-Side Navigation Limitations**: Next.js client-side navigation (router.push, Link components) can bypass middleware execution - this is documented Next.js behavior. Middleware primarily protects direct URL access and server-side navigation.

5. **No Test Bypasses in Production**: Never implement authentication bypass systems (like test-auth-bypass cookies) that can be exploited. Use real authentication in all environments.

6. **Dual-Layer Protection**: Implement both middleware-level and component-level route protection, but understand that middleware is the primary security layer and components are supplementary.

**Example Secure Middleware Pattern**:

```typescript
// Use getUser() for reliable authentication
const {
  data: { user },
} = await supabase.auth.getUser();

// Exact route matching to prevent wildcards
const publicRoutes = ["/login", "/signup"];
const isPublicRoute = publicRoutes.includes(pathname);

// Handle root path separately
if (pathname === "/") {
  // Root path logic
}

// Different error handling for API vs page routes
if (!user) {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

// Fetch user role from database for authorization
const { data: userData } = await supabase
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single();
```

## Key Conventions

### Code Style

- Use named exports for components
- Collocate related files (component + test + styles)
- Prefix server components with 'Server' when needed
- Use absolute imports from '@/'

### Responsive Design Requirements

- **Mobile-first approach**: Design for mobile (320px) then scale up
- **Breakpoints**: sm:640px, md:768px, lg:1024px, xl:1280px, 2xl:1536px
- **Touch interactions**:
  - Pull-to-refresh on list views
  - Swipe actions on mobile (e.g., swipe to delete/archive)
  - Touch-friendly tap targets (min 44x44px)
- **Mobile optimizations**:
  - Drawer navigation on mobile
  - Bottom sheet modals
  - Optimized images with lazy loading
  - Reduced data fetching on mobile
- **Viewport testing**: Test on iPhone SE (375px) to iPad Pro (1024px)

### State Management

- Server state: TanStack Query
- Client state: React hooks (useState, useReducer)
- Form state: React Hook Form
- Global state: Zustand (if needed)

### Design System Implementation

- **Color System**: Custom gray scale and brand colors defined in CSS variables and Tailwind config
- **Typography**: Consistent scale with responsive adjustments for mobile
- **Components**: All shadcn/ui components customized to match design system
- **Spacing**: 4px grid system throughout
- **Important**: Must use Tailwind CSS v3 (not v4) for proper compilation

### Error Handling

- Use error boundaries for UI errors
- Consistent error response format
- User-friendly error messages
- Log errors to monitoring service

### Testing Strategy

- **CRITICAL**: Always verify server responds before testing: `curl -f http://localhost:3001`
- **Unit tests**: Utilities and hooks with Vitest
- **Integration tests**: API routes with Vitest
- **E2E tests**: Critical user flows with Playwright (headed, real UI interaction)
- **Visual regression**: Screenshots and component testing
- **Test selectors**: Use `page.locator().filter()` patterns, not `page.click('text=')`
- **Port consistency**: All tests run against localhost:3001
- **Server verification**: Never assume server is running - always HTTP test first

#### E2E Test Best Practices

- **Avoid strict element visibility checks**: Tests should not fail on `toBeVisible` for specific elements that may render differently in test environments
- **Focus on navigation success**: Verify URL changes and page loads rather than specific UI elements
- **Use waitForLoadState**: Prefer `waitForLoadState('domcontentloaded')` and `waitForLoadState('networkidle')` over waiting for specific elements
- **Handle loading states gracefully**: Don't fail tests because of loading spinners - they may persist longer in test environments
- **Common test pattern for page navigation**:
  ```typescript
  await page.goto("/target-page");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/target-page");
  ```
- **Known issues**:
  - React Server Component (RSC) requests may fail with `net::ERR_ABORTED` in tests - this is expected and shouldn't fail tests
  - Loading spinners may persist longer in test environments than in manual testing
  - The `<main>` element or specific heading tags may not be immediately available in test environments

### Git Workflow

- **Development Branch**: `editing-branch` (primary development branch)
- **Production Branch**: `main` (stable releases only)
- **Conventional commits**: Use clear, descriptive commit messages
- **Protected main branch**: All changes go through editing-branch first

#### GitHub Push Process

**ALWAYS push to editing-branch first:**

```bash
# 1. Make your changes and commit
git add .
git commit -m "feat: descriptive commit message"

# 2. Push to editing-branch (primary development branch)
git push origin editing-branch

# 3. Assistant will prompt: "Do you want to merge with main?"
# If YES:
git checkout main
git merge editing-branch
git push origin main
git checkout editing-branch

# If NO: Continue working on editing-branch
```

**Important**: Never push directly to main. Always use editing-branch → main workflow.

## CRITICAL: Server Verification Protocol

### NEVER ASSUME SERVER IS RUNNING

Before any development or testing activity, ALWAYS verify the server is actually responding:

```bash
# 1. Kill any existing processes
pkill -f "next dev"

# 2. Start server in background
PORT=3001 npm run dev &

# 3. Wait for startup (reduced from 5s to 2s)
sleep 2

# 4. VERIFY server responds (REQUIRED)
curl -f http://localhost:3001
# If this fails, server is NOT working

# 5. VERIFY specific pages load (REQUIRED)
curl -I http://localhost:3001/login
curl -I http://localhost:3001/signup
# If these fail, routing is broken

# 6. Check server logs if verification fails
# Look for actual error messages, not just process existence
```

### Common False Positive Patterns to AVOID:

- ❌ `ps aux | grep "next dev"` - only checks process exists, not if it works
- ❌ `lsof -i :3001` - only checks port is bound, not if it responds
- ❌ Assuming server works because command completed
- ❌ Testing without HTTP verification first

### Required Verification Pattern:

- ✅ `curl -f http://localhost:3001` - actual HTTP response test
- ✅ Check HTTP status codes
- ✅ Verify specific pages load before testing
- ✅ Read actual error logs when verification fails

## Task Checklist Feature

### Overview

Tasks within service templates can now include internal checklists for tracking completion steps. These checklists are never visible to clients and are designed for internal team use only.

### Key Features

- **Internal Only**: Checklists are never shown to clients, maintaining clean client-facing task views
- **Smart Completion**: When all checklist items are completed, system prompts with toast notification asking if task should be marked as done
- **Template Integration**: Checklist items are defined in service templates and automatically copied to tasks when services are assigned to clients
- **Real-time Updates**: Checklist progress is updated instantly with visual feedback

## Dynamic Field Click-to-Copy Feature

### Overview

All dynamic fields (displayed in the format `{{fieldName}}`) throughout the application are now clickable and will copy the field to the clipboard when clicked. This provides a seamless user experience for working with dynamic fields across forms, content tools, and client data.

### Key Features

- **Universal Click-to-Copy**: Any dynamic field pattern `{{fieldName}}` displayed anywhere in the app is clickable
- **Visual Feedback**: Fields have hover states and copy cursor indicators
- **Toast Notifications**: Successful copy operations show confirmation toasts
- **Consistent Styling**: Three variants available: `inline`, `code`, and `badge` for different contexts
- **Auto-Detection**: The `DynamicText` component automatically detects and makes dynamic field patterns clickable in any text content

### Implementation

- **DynamicField Component**: Renders individual dynamic fields as clickable elements
- **DynamicText Component**: Automatically processes text to make any `{{field}}` patterns clickable
- **Used Throughout**: Form responses, content tools, generated content, and field configuration areas

### Implementation Details

#### Database Schema

```sql
-- Task table includes checklist field
checklist Json? // Array of {id: string, text: string, completed: boolean}
```

#### Service Template Creation

- Add checklist items to tasks during template creation
- Items can be added/removed dynamically
- Empty checklist items are filtered out on save
- Form validation allows temporary empty text during editing

#### Task Management

- Checklist items display with checkboxes for completion tracking
- Progress indicator shows "Checklist (2/5)" format
- Completed items show strikethrough styling
- Toast notification appears when all items completed: "All checklist items completed! Should we mark this task as done?"

#### Client Visibility

- Tasks show normal name/description to clients
- Checklist items are completely hidden from client view
- Small note appears in template editor: "Note: Checklists are never visible to clients"

### Usage Flow

1. **Template Creation**: Add checklist items to tasks in service templates
2. **Service Assignment**: Checklist items automatically copied to actual tasks
3. **Task Execution**: Team members check off items as they complete them
4. **Completion Prompt**: System suggests marking task as done when all items completed
5. **Client View**: Clients see clean task view without internal checklist details

## Content Tools Enhanced Features

### Overview

Content tools have been significantly enhanced with improved UI/UX, dynamic generated content management, and comprehensive client data integration.

### Key Features

#### Dynamic Field Integration

- **Client Data Fields**: Automatic integration of client name, business name, and address
- **Form Response Fields**: Dynamic fields from client form responses are automatically available
- **Smart Notifications**: Toast notifications inform users when clients have missing or partial dynamic field data
- **Organized Display**: Available dynamic fields are organized by category (Client Data, form-specific sections)

#### Enhanced Generated Content Management

- **Client-Specific Filtering**: Generated content section dynamically updates based on client selection
- **Just Generated Section**: New content appears in a highlighted "Just Generated" section with green accent
- **Previous Generations**: Comprehensive history with metadata including client name, generation date, and prompt preview
- **Sorting Options**: Sort by date or client when viewing all content for a tool
- **Individual Actions**: Copy and download actions for each piece of generated content
- **Real-time Updates**: Content list refreshes automatically after new generations

#### Improved UI/UX

- **Better Styling**: Clean, organized layouts with proper visual hierarchy
- **Scrollable Sections**: Handle large amounts of content gracefully
- **Context-Aware Empty States**: Helpful guidance messages when no content is available
- **Responsive Design**: Works well on all screen sizes
- **Professional Appearance**: Consistent with overall application design system

#### Content Storage & Organization

- **Database Storage**: All generated content is properly stored in the `generated_content` table
- **Metadata Tracking**: Comprehensive metadata including variables used, timestamps, and generation context
- **Client Association**: Content is properly linked to specific clients for easy retrieval
- **Tool Association**: Content is organized by the specific content tool used

### API Improvements

- **Proper Authentication**: Fixed middleware to handle API route authentication correctly
- **Error Handling**: Proper JSON error responses for API routes instead of redirects
- **Client Filtering**: Generated content API supports optional client filtering
- **Consistent Response Format**: Standardized API response format with proper metadata

### Technical Implementation

- **Middleware Fixes**: Corrected authentication handling for API routes vs page routes
- **Dynamic Content Endpoint**: New `/api/content-tools/[id]/generated-content` endpoint with client filtering
- **Enhanced Components**: Improved `ContentGenerator` component with better state management
- **Toast Integration**: Smart notifications using the toast system for user feedback

## Latest Application Features & Status

### Current Implementation Status

- ✅ **Authentication & Authorization**: Complete role-based access control with proper middleware
- ✅ **Client Management**: Full CRUD operations with form responses and generated content
- ✅ **Service Templates & Tasks**: Complete with internal checklist functionality
- ✅ **Forms System**: Drag-and-drop builder with dynamic field support
- ✅ **Content Tools**: AI-powered generation with comprehensive UI/UX enhancements
- ✅ **Requests System**: Duda webhook integration with comment threading
- ✅ **Settings Management**: API keys, team management, webhooks
- ✅ **Dynamic Fields**: Universal click-to-copy functionality throughout app
- ✅ **Attachment System**: File upload/management across all entities
- ✅ **Activity Logging**: Comprehensive audit trail system

### Recent Major Updates

- **Content Tools AI Integration**: Direct AI generation using Anthropic/OpenAI APIs
- **Enhanced Generated Content Management**: Dynamic filtering, history, and metadata tracking
- **Middleware Security Fixes**: Proper API route authentication handling
- **Dynamic Field UX**: Click-to-copy functionality with smart notifications
- **Task Checklist System**: Internal tracking never visible to clients
- **Improved Error Handling**: Consistent JSON responses for API routes

### Development Workflow

- **Primary Branch**: `editing-branch` for all development work
- **Production Branch**: `main` for stable releases
- **Testing**: Comprehensive E2E testing with Playwright on port 3001
- **Server Verification**: Always verify server responds before testing/development
