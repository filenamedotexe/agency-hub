# Agency Hub - Systematic Build Plan

## Core Principles

1. **Build Small, Test Often**: Each feature gets unit tests + E2E tests before moving on
2. **Vertical Slices**: Build complete features end-to-end rather than all backend then all frontend
3. **Testing Gates**: Can't proceed to next phase until current phase passes all tests
4. **Error Prevention**: Type safety, validation, and error boundaries from day one

## Phase 0: Project Foundation (Week 1)

**Goal**: Rock-solid foundation with testing infrastructure

1. **Initial Setup**

   - Create Next.js app with TypeScript
   - Configure ESLint, Prettier, Husky
   - Set up Playwright with headed browser config
   - Configure Vitest for unit tests
   - Create basic CI/CD pipeline

2. **Supabase Setup**

   - Initialize Supabase project
   - Set up Prisma with initial schema (just users table)
   - Configure environment variables
   - Create database connection health check

3. **Testing Checkpoint - WITH ACTUAL VERIFICATION**
   ```
   ✓ Server starts: PORT=3001 npm run dev
   ✓ Server responds: curl -f http://localhost:3001 (MUST succeed)
   ✓ Playwright smoke test: actual page loads in browser
   ✓ Database connection test: actual query succeeds
   ✓ Environment variable validation
   ✓ Build process completes without errors
   ```

## Phase 1: Authentication Foundation (Week 2)

**Goal**: Bulletproof auth with all roles

1. **Implementation**

   - Supabase Auth setup with email/password
   - Role-based middleware
   - Login/Signup pages with validation
   - Protected route wrapper
   - Session management
   - Core responsive layout:
     - Desktop: Sidebar navigation
     - Mobile: Drawer + bottom navigation
     - Tablet: Collapsible sidebar

2. **Error Handling**

   - Invalid credentials feedback
   - Network error recovery
   - Session expiry handling
   - Rate limiting on auth endpoints

3. **Testing Checkpoint - SERVER VERIFICATION REQUIRED**
   ```
   ✓ Server verification: curl -f http://localhost:3001/login (MUST work first)
   ✓ E2E: Complete auth flow for each role (headed browser)
   ✓ E2E: Protected route access denied when not authenticated
   ✓ E2E: Role-based access control
   ✓ Unit: Validation functions
   ✓ Unit: Auth middleware logic
   ```

## Phase 2: Basic CRUD - Clients Module (Week 3)

**Goal**: Complete client management with activity logging

1. **Implementation**

   - Clients table with Prisma migrations
   - List view with pagination
   - Add/Edit client forms
   - Client detail page
   - Activity logging system
   - Basic search/filter

2. **Testing Checkpoint**
   ```
   ✓ E2E: Create client → View in list → Edit → Delete (headed browser)
   ✓ E2E: Search and filter clients (real UI interaction)
   ✓ E2E: Activity log shows all actions (with screenshots)
   ✓ E2E: Form validation prevents bad data (visual feedback)
   ✓ E2E: Pull-to-refresh updates client list (mobile viewport test)
   ✓ E2E: Responsive layout on localhost:3001
   ✓ Unit: Client service functions (Vitest)
   ✓ API: CRUD endpoints with error cases
   ```

## Phase 2B: UI/UX Polish & Design System (Week 3.5)

**Goal**: Transform the functional UI into a polished, modern interface
**Detailed Spec**: See `phase-2b-design-system.md` for complete implementation details

1. **Design System Foundation**

   - Implement complete color palette (neutrals + brand colors)
   - Define typography scale (12px to 30px) with consistent hierarchy
   - Establish 4px spacing grid system
   - Create CSS variables for all design tokens
   - Structure for future light/dark mode support

2. **Core Component Styling**

   - Update all shadcn/ui components with new design tokens
   - Implement subtle shadows and lighter borders (gray-200)
   - Add skeleton loading states for all async content
   - Smooth 150-200ms transitions on all interactions
   - Ensure 44px minimum touch targets throughout

3. **Layout & Spacing Refinements**

   - Page padding: 32px desktop, 16px mobile
   - Card styling: white bg, gray-200 border, hover shadow
   - Increase whitespace between sections (24px)
   - Sticky table headers with gray-50 background
   - Professional empty states with icons

4. **Form & Input Polish**

   - Larger inputs (44px height, 16px font size)
   - Clear focus states with primary color ring
   - Improved error styling with red-500 and red-100 bg
   - Better placeholder text (gray-400)
   - Consistent validation feedback placement

5. **Navigation & Feedback**

   - Clean sidebar with subtle hover states
   - Active state with primary-light background
   - Refined toast notifications matching design system
   - Loading skeletons instead of spinners
   - Subtle micro-interactions (1px elevation on hover)

6. **Testing Checkpoint**
   ```
   ✓ Visual regression tests (Playwright screenshots on localhost:3001)
   ✓ WCAG AA compliance (color contrast ratios)
   ✓ Touch target audit (44px minimum)
   ✓ Loading state coverage check (headed browser verification)
   ✓ Responsive testing (primary: 1280x720, secondary: mobile viewports)
   ✓ Keyboard navigation verification (real UI interaction)
   ✓ Reduced motion preferences respected
   ```

## Phase 3: Services & Tasks (Week 4)

**Goal**: Service template system with task management

1. **Implementation**

   - Service templates CRUD
   - Assign services to clients
   - Task management within services
   - Status workflows
   - Client visibility toggles

2. **Progressive Testing**

   ```
   After templates:
   ✓ E2E: Create/edit service templates

   After assignment:
   ✓ E2E: Assign service to client
   ✓ E2E: Service appears on client page

   After tasks:
   ✓ E2E: Add/edit/delete tasks
   ✓ E2E: Toggle client visibility
   ✓ E2E: Task status updates
   ```

## Phase 4: File Attachments (Week 5, Part 1)

**Goal**: Reliable file upload/download system

1. **Implementation**

   - Supabase Storage setup
   - File upload component with progress
   - Attachment management UI
   - File type validation
   - Size limits and quotas

2. **Testing Checkpoint**
   ```
   ✓ E2E: Upload file → See in list → Download
   ✓ E2E: File type rejection
   ✓ E2E: File size limit enforcement
   ✓ E2E: Multiple file upload
   ✓ Unit: File validation functions
   ```

## Phase 5: Requests & Webhooks (Week 5, Part 2)

**Goal**: Duda integration with request management

1. **Implementation**

   - Webhook endpoint with signature verification
   - Request creation from webhooks
   - Kanban view with drag-and-drop
   - List view with sorting
   - Manual request creation

2. **Testing Strategy**
   ```
   ✓ E2E: Manual request creation
   ✓ E2E: Kanban drag-and-drop status change
   ✓ E2E: Swipe to change status (mobile)
   ✓ E2E: List view sorting/filtering
   ✓ E2E: Pull-to-refresh for new requests
   ✓ E2E: Mobile Kanban horizontal scroll
   ✓ Integration: Webhook endpoint with mock Duda payload
   ✓ Unit: Webhook signature verification
   ```

## Phase 6: Form Builder (Weeks 6-7)

**Goal**: Drag-and-drop form builder with responses

1. **Incremental Build**

   - Week 6.1: Basic form CRUD
   - Week 6.2: Drag-and-drop field addition (with mobile tap-to-add fallback)
   - Week 6.3: Field configuration with mobile-friendly editors
   - Week 7.1: Form preview/test mode on all viewports
   - Week 7.2: Response storage and viewing

2. **Testing Each Increment**
   ```
   After each sub-phase:
   ✓ E2E: Current functionality works end-to-end
   ✓ E2E: No regressions in previous features
   ✓ Unit: New utility functions
   ```

## Phase 7: Dashboard & Analytics (Week 8)

**Goal**: Meaningful analytics with real-time updates

1. **Implementation**

   - Dashboard layout
   - Client/service metrics
   - Activity timeline
   - Real-time updates via Supabase
   - Performance optimization

2. **Testing Checkpoint**
   ```
   ✓ E2E: Dashboard loads with correct data (localhost:3001, headed)
   ✓ E2E: Real-time updates when data changes (visual verification)
   ✓ E2E: Charts render correctly (screenshot comparison)
   ✓ E2E: Mobile: Charts are scrollable/swipeable (viewport testing)
   ✓ Performance: Page loads under 2s (Playwright timing)
   ✓ Performance: Smooth scrolling on mobile (interaction testing)
   ```

## Phase 8: Content Tools & Settings (Week 9)

**Goal**: AI content generation, webhook management, and settings

1. **Implementation**

   - Content tool UI with prompt management
   - Dynamic field insertion
   - Generated content history
   - Settings page with:
     - API key management (encrypted storage)
     - User/role management
     - Account settings
   - Automations/Webhook management:
     - Form webhooks
     - Content tool webhooks
     - General webhooks

2. **Testing Checkpoint**
   ```
   ✓ E2E: Generate content → View result → Save to client
   ✓ E2E: Dynamic field replacement
   ✓ E2E: API key CRUD (without exposing keys)
   ✓ E2E: Add/remove team members with roles
   ✓ E2E: Webhook configuration for forms
   ✓ Integration: Webhook to n8n simulation
   ✓ Unit: Prompt template processing
   ✓ Unit: API key encryption/decryption
   ```

## Testing Best Practices Throughout

1. **E2E Test Structure - VERIFY SERVER FIRST**

   ```typescript
   // CRITICAL: Always verify server responds before any test
   test.beforeAll(async () => {
     // Verify server is actually responding
     const response = await fetch("http://localhost:3001");
     if (!response.ok) throw new Error("Server not responding on port 3001");
   });

   // Each test follows Arrange-Act-Assert with proper UI interaction
   test("Admin can create and assign service", async ({ page }) => {
     // Arrange: Login as admin and wait for page load
     await loginAsAdmin(page);
     await page.waitForLoadState("networkidle");

     // Act: Create service and assign
     await page.goto("/services");
     await page.locator("button").filter({ hasText: "New Service" }).click();
     // ... complete form with proper selectors

     // Assert: Service appears correctly
     await expect(page.locator('[data-testid="service-card"]')).toBeVisible();
   });
   ```

2. **Error Scenario Testing - WITH ACTUAL VERIFICATION**

   - **Server connectivity**: `curl -f http://localhost:3001` before any test
   - Network failures (headed browser observation)
   - Invalid data (real form validation)
   - Concurrent updates (visual state changes)
   - Permission denials (redirect verification)
   - **Never assume server is running** - always HTTP verify first

3. **Visual Testing**

   - Screenshot comparisons (Playwright auto-capture)
   - Mobile viewport testing (375px, 768px when needed)
   - Responsive design verification (primary: 1280x720)

4. **Responsive Testing for Every Phase - VERIFY SERVER FIRST**
   - **CRITICAL FIRST STEP**: `curl -f http://localhost:3001` must succeed before any testing
   - **Primary testing**: 1280x720 (Chrome desktop) for development speed
   - **Secondary testing**: 375px (iPhone SE), 768px (iPad), 1024px (iPad Pro) when needed
   - Touch interactions work properly
   - No horizontal scroll on any viewport
   - Text remains readable without zooming
   - Interactive elements have proper touch targets (44x44px minimum)
   - **All tests run on localhost:3001** with headed browser
   - **Never assume server works** - always HTTP verify connectivity first

This approach ensures each feature is thoroughly tested before moving on, preventing error accumulation and maintaining confidence in the codebase.

## GitHub Workflow & Version Control

### Development Process

All development work happens on the `editing-branch`:

1. **Make Changes**: Implement features, fix bugs, update documentation
2. **Commit Changes**: Use conventional commit messages
3. **Push to editing-branch**: `git push origin editing-branch`
4. **Merge Decision**: Assistant prompts whether to merge with main

### Branch Strategy

- **editing-branch**: Primary development branch
  - All day-to-day development
  - Feature implementation
  - Bug fixes
  - Documentation updates
- **main**: Production/stable branch
  - Only stable, tested code
  - Major milestone releases
  - Deployable versions

### Automated GitHub Push Process

```bash
# Standard development workflow
git add .
git commit -m "feat: implement client search functionality"
git push origin editing-branch

# When ready for production release
git checkout main
git merge editing-branch
git push origin main
git checkout editing-branch
```

### Commit Message Conventions

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/updates
- `chore:` - Maintenance tasks

### Release Process

1. Complete feature on `editing-branch`
2. Run all tests and verify functionality
3. Assistant asks: "Do you want to merge with main?"
4. If YES: Merge to main and push (creates release)
5. If NO: Continue development on editing-branch

This ensures main always contains stable, production-ready code while allowing continuous development on editing-branch.
