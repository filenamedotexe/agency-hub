# CLAUDE.md

**📁 This documentation has been restructured for better performance and maintainability.**

## Quick Start

For comprehensive guidance on working with this codebase, see the organized documentation in:

**[`cursor/rules/`](./cursor/rules/)**

### Quick Navigation

- **[📋 Overview & Index](./cursor/rules/00-overview.md)** - Start here for navigation to all other docs
- **[🎯 Project Overview](./cursor/rules/01-project-overview.md)** - App purpose, roles, menu structure
- **[⚙️ Tech Stack](./cursor/rules/02-tech-stack.md)** - Frontend, backend, testing technologies
- **[🛠️ Development Commands](./cursor/rules/03-development-commands.md)** - Server startup, testing, deployment
- **[🏗️ Architecture](./cursor/rules/04-architecture.md)** - Database schema, APIs, folder structure
- **[🔒 Security](./cursor/rules/05-security.md)** - Authentication, authorization, middleware
- **[📝 Code Conventions](./cursor/rules/06-code-conventions.md)** - Style, responsive design, state management
- **[🧪 Testing Strategy](./cursor/rules/07-testing-strategy.md)** - E2E, unit testing, server verification
- **[🌿 Git Workflow](./cursor/rules/08-git-workflow.md)** - Branch strategy, push process
- **[✨ Features](./cursor/rules/09-features.md)** - Current features, recent updates
- **[🚀 Deployment Status](./cursor/rules/10-deployment-status.md)** - Production build status, environment setup

## Recent Updates

### 📅 Calendar Feature Phase 4 - COMPLETED & TESTED ✅ (Latest)

**All Phase 4 calendar issues fixed and thoroughly tested with Playwright:**

#### 🔧 **Critical Fixes Applied:**

1. **Select.Item Empty String Error** - Fixed `<SelectItem value="">None</SelectItem>` → `<SelectItem value="none">None</SelectItem>`
2. **Clients API Response Structure** - Fixed API to return `{data: [...], pagination: {...}}` format
3. **Calendar View Switching** - Fixed `defaultView` → `view` prop with `onView` callback for react-big-calendar
4. **Admin User Restoration** - Recreated accidentally deleted admin@example.com user

#### 🧪 **Comprehensive Testing Results:**

- **✅ Manager Role Testing** - All calendar features working perfectly
- **✅ Admin Role Testing** - All calendar features working perfectly
- **✅ Authentication Flow** - Proper login → dashboard → calendar navigation
- **✅ New Booking Modal** - All form fields, dropdowns, and validation working
- **✅ Clients Dropdown** - Loading 4 test clients correctly
- **✅ Services Dropdown** - Loading 6 services + "None" option correctly
- **✅ Calendar View Switching** - Month/Week/Day/Agenda views switching perfectly
- **✅ Calendar Navigation** - Today/Back/Next buttons working
- **✅ Sidebar Components** - Mini calendar and upcoming bookings working

#### 📋 **Phase 4 Components Status:**

All calendar components from Phase 4 are now fully functional and tested:

- Page structure & layout ✅
- Action buttons (Availability, New Booking) ✅
- Google Calendar integration card ✅
- Calendar sidebar with mini calendar ✅
- Upcoming bookings section ✅
- Main calendar view with time slots ✅
- Calendar controls and view switching ✅
- Booking modal with all form fields ✅

### 🔧 Logout Functionality Fixes

- **Simplified logout flow**: Removed complex error handling that was causing issues
- **Immediate session clearing**: Auth provider now clears session immediately for better UX
- **Background cleanup**: Server-side logout happens asynchronously to prevent UI blocking
- **Added debugging**: Console logs added to track logout button clicks and flow
- **Streamlined API**: Logout endpoint simplified to always return success

### 🛡️ Auth System Optimization - COMPLETED ✅

**Major performance and UX improvements to authentication system:**

#### 🎯 **Problems Solved:**

1. **Persistent loading spinners** during navigation
2. **Overly sensitive logout** on back button
3. **Poor middleware performance** with API calls on every request
4. **Race conditions** from multiple auth checks

#### 🚀 **Optimizations Implemented:**

**Phase 1 - Loading & Timeouts:**

- Added 5-second timeout for loading states to prevent infinite spinners
- Created auth debug utility (`auth-debug.ts`) with `NEXT_PUBLIC_AUTH_DEBUG=true`
- Optimized middleware to skip static assets

**Phase 2 - State Persistence & Caching:**

- Implemented **sessionStorage-based auth state** (`auth-state.ts`) to persist between navigations
- Added **middleware caching** (`middleware-cache.ts`) with 1-minute TTL for user roles
- Reduced database queries by ~90% for repeat requests

**Phase 3 - Client-Side Optimizations:**

- Simplified auth provider to remove redundant checks
- Added **auth error boundary** (`auth-error-boundary.tsx`) for graceful error handling
- Optimized session refresh from 1 minute to **5 minutes**
- Removed scroll/mousemove from activity tracking

**Phase 4 - Comprehensive Testing:**

- Created full Playwright test suite (`tests/auth-optimization.spec.ts`)
- Achieved **100% test pass rate** (13/13 tests)
- Documented all changes in `docs/auth-optimization-changes.md`

#### 📊 **Performance Improvements:**

- Navigation time: **2-3s → ~500ms** (without loading spinners)
- Middleware execution: **~400ms → ~80ms** (when cached)
- Database queries: **Every request → Once per minute per user**

#### 📁 **New Files Created:**

- `/src/lib/auth-state.ts` - Global auth state management
- `/src/lib/middleware-cache.ts` - Middleware caching utility
- `/src/lib/auth-debug.ts` - Debug logging utility
- `/src/components/providers/auth-error-boundary.tsx` - Error boundary
- `/tests/auth-optimization.spec.ts` - Comprehensive test suite
- `/docs/auth-optimization-changes.md` - Detailed documentation

## Critical Reminders

⚠️ **ALWAYS verify server responds before testing**: `curl -f http://localhost:3001`

⚠️ **Use editing-branch for development**, merge to main only for releases

⚠️ **Port consistency**: All development on port 3001

---

_This restructure eliminates the 49.1k character performance warning while preserving all information in organized, focused files._
