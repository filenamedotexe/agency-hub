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

### 🎨 UI/UX Complete Overhaul - COMPLETED ✅

**All pages now use the enhanced component library with animations and responsive design:**

#### 🎯 **Implementation Complete:**

- ✅ **Enhanced Components**: MotionButton, EnhancedCard, SkeletonLoader, EmptyState
- ✅ **Motion Elements**: Page transitions, list animations, input effects
- ✅ **Responsive Design**: Mobile-first approach with responsive tables
- ✅ **Consistent Styling**: All pages updated to use enhanced components
- ✅ **Performance Optimized**: Smooth animations, lazy loading
- ✅ **Accessibility**: Respects prefers-reduced-motion

See [`docs/ui-ux-components.md`](./docs/ui-ux-components.md) for complete component documentation.

### 🛍️ Stripe Store Feature - IN PROGRESS

**Comprehensive e-commerce store with Stripe integration for service purchases:**

#### 🎯 **Current Status:**

- ✅ Stripe account setup with test API keys configured
- ✅ MCP (Model Context Protocol) configured for Stripe integration
- ✅ Environment variables set up for store functionality
- ✅ Comprehensive implementation plan created
- ✅ Database schema designed for store models
- 🔄 Ready for Phase 1 implementation

#### 📋 **Store Feature Components:**

**Phase 1 - Foundation (In Progress):**

- Shopping cart with localStorage/API sync
- Service templates with store-specific fields (price, description, images)
- "My Services" dashboard widget for clients
- Store page structure with service grid

**Phase 2 - Stripe Integration:**

- Stripe checkout integration with test mode
- Payment webhook handling
- E-signature contract system
- Service auto-provisioning after payment

**Phase 3 - Order Management:**

- Order history with visual timeline
- Admin order management dashboard
- Professional invoice generation (PDF)
- Sales analytics and reporting
- Client lifetime value (LTV) tracking

**Phase 4 - Polish & Launch:**

- Refund management UI
- UI/UX improvements
- Comprehensive testing
- Production deployment

#### 🚀 **Key Features:**

- **Self-Service Purchasing**: Clients can browse and purchase services directly
- **Contract Protection**: E-signature requirements for service agreements
- **Automated Provisioning**: Services automatically assigned after payment
- **Business Intelligence**: Track revenue, LTV, and sales metrics
- **Professional Invoicing**: Automated PDF invoice generation
- **Webhook Integration**: Real-time payment status updates

### 📅 Calendar Feature Phase 4 - COMPLETED & TESTED ✅

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

### 🛡️ Auth System Optimization - COMPLETED ✅

**Major performance and UX improvements to authentication system:**

#### 📊 **Performance Improvements:**

- Navigation time: **2-3s → ~500ms** (without loading spinners)
- Middleware execution: **~400ms → ~80ms** (when cached)
- Database queries: **Every request → Once per minute per user**

#### 🚀 **Key Optimizations:**

- **Session State Persistence**: Auth state stored in sessionStorage
- **Middleware Caching**: In-memory cache for user roles (1-minute TTL)
- **Auth Error Boundary**: Graceful error handling
- **Loading Timeouts**: 5-second timeout prevents infinite spinners
- **Optimized Session Refresh**: Changed from 1-minute to 5-minute intervals

### 🔧 Additional Recent Updates

- **Content Tools AI Integration**: Direct AI generation using Anthropic/OpenAI APIs
- **Dynamic Field Click-to-Copy**: Universal click-to-copy for all `{{fieldName}}` patterns
- **Task Checklist System**: Internal tracking never visible to clients
- **Enhanced Webhook System**: Production/Testing URL support with execution tracking
- **Dual Callback URL System**: Environment-aware callback URLs eliminate manual URL swapping
- **Logout Functionality Fixes**: Simplified flow with immediate session clearing

## Critical Reminders

⚠️ **ALWAYS verify server responds before testing**: `curl -f http://localhost:3001`

⚠️ **Use editing-branch for development**, merge to main only for releases

⚠️ **Port consistency**: All development on port 3001

---

_This restructure eliminates the 49.1k character performance warning while preserving all information in organized, focused files._
