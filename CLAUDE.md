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
  - The tools use a prompt that the admins set/edit for each Content Tool run & can use dynamic fields attached to the user to create bespoke content for a selected client (thats how the dynamic fields are populated in the content tool)
    - Each tool has a webhook to set that sends info (prompt with dynamic fields) post request to a webhook in n8n
      - The content for that tool (and the user it was ran for) is then returned in the tool to view nicely and also saved to the users user detail page under "Generated Content"
  - Tools
    - Blog Writer
    - Facebook Video Ad Script & Caption Writer
    - Facebook Image Ad & Caption Writer
    - Google Search Ad Writer
    - SEO KW Research

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
service_templates (id, name, type, default_tasks, price)
services (id, template_id, client_id, status, custom_tasks)
tasks (id, service_id, name, description, due_date, client_visible, status)
forms (id, name, schema, settings)
form_responses (id, form_id, client_id, response_data, submitted_at)
requests (id, client_id, description, status, duda_data, created_at)
activity_logs (id, user_id, entity_type, entity_id, action, metadata)
attachments (id, entity_type, entity_id, file_path, metadata)
api_keys (id, service, encrypted_key, created_by)

-- Relationships
- One client → many forms
- One client → many services
- One service → many tasks (tasks cannot exist without services)
- Forms can attach to services OR directly to clients
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
