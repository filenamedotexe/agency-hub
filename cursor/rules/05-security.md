# Security Architecture

## Overview

- **Authentication**: Supabase Auth with JWT
- **Authorization**: Role-based with RLS policies
- **API Security**: Rate limiting, CORS, webhook signatures
- **Data Protection**: Encrypted API keys, secure file storage

## Critical Middleware Implementation Notes

**IMPORTANT**: Role-based access control in Next.js requires careful implementation to avoid security vulnerabilities:

### 1. Middleware Authentication Method

Always use `supabase.auth.getSession()` in middleware for the most reliable authentication check. This reads from cookies directly and works reliably in middleware context.

### 2. Route Matching Precision

Be extremely careful with route patterns in middleware. Using `"/"` in publicRoutes will match ALL routes starting with `/`, making every route public. Use exact matching for root paths.

### 3. API Route vs Page Route Handling

Middleware must handle API routes differently from page routes:

- **API routes**: Return JSON error responses (401/403) for auth failures
- **Page routes**: Redirect to login page for auth failures
- Never redirect API routes to login pages (causes CORS issues)

### 4. Client-Side Navigation Limitations

Next.js client-side navigation (router.push, Link components) can bypass middleware execution - this is documented Next.js behavior. Middleware primarily protects direct URL access and server-side navigation.

### 5. No Test Bypasses in Production

Never implement authentication bypass systems (like test-auth-bypass cookies) that can be exploited. Use real authentication in all environments.

### 6. Dual-Layer Protection

Implement both middleware-level and component-level route protection, but understand that middleware is the primary security layer and components are supplementary.

## Example Secure Middleware Pattern

```typescript
// Use getSession() for reliable authentication
const {
  data: { user },
} = await supabase.auth.getSession();

// Exact route matching to prevent wildcards
const publicRoutes = ["/login", "/signup"];
const isPublicRoute = publicRoutes.includes(pathname);

// Handle root path separately
if (pathname === "/") {
  // Root path logic
}

// Skip auth for static assets (performance optimization)
if (pathname.startsWith("/_next/static") || pathname.startsWith("/favicon")) {
  return NextResponse.next();
}

// Check middleware cache for performance (1-minute TTL)
const cached = getCachedAuth(user?.id);
if (cached) {
  // Use cached role data
  return handleAuthorization(cached.role);
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

// Cache the result for future requests
setCachedAuth(user.id, userData);
```

## Auth System Optimizations (2025)

### Performance Enhancements

1. **Middleware Caching**: User roles cached for 1 minute to reduce database queries
2. **Session State Persistence**: Auth state stored in sessionStorage to prevent loading spinners
3. **Optimized Session Refresh**: Reduced from 1 minute to 5 minutes for better performance
4. **Static Asset Bypass**: Middleware skips authentication for static resources

### New Security Features

1. **Auth Error Boundary**: Graceful error handling for authentication failures
2. **Loading Timeouts**: 5-second timeout prevents infinite loading states
3. **Debug Mode**: Enable with `NEXT_PUBLIC_AUTH_DEBUG=true` for troubleshooting
4. **Activity-Based Refresh**: Session only refreshes on meaningful user interactions

### Architecture Components

- `/src/lib/auth-state.ts` - Global auth state management with sessionStorage
- `/src/lib/middleware-cache.ts` - In-memory cache for middleware auth checks
- `/src/lib/auth-debug.ts` - Debug logging utility for auth flow analysis
- `/src/components/providers/auth-error-boundary.tsx` - Error boundary for auth failures

## Role-Based Access Control

### User Roles & Permissions

- **Admin**: Full access to all features including settings, webhooks, API keys
- **Service Manager**: Access to client management, services, forms, requests (no settings)
- **Copywriter**: Limited to assigned services and tasks
- **Editor**: Limited to assigned services and tasks
- **VA**: Limited permissions for assigned tasks
- **Client**: Only client dashboard access

### Route Protection

Routes are protected at both middleware and component level:

- Middleware handles initial authentication and role-based routing
- Protected components provide additional checks for sensitive actions
- API routes validate authentication and authorization independently

## Data Security

### Encryption

- API keys stored with encryption using industry-standard methods
- Only last four characters displayed in UI
- Full keys never exposed in client-side code

### File Storage

- Supabase Storage with Row Level Security (RLS)
- File access tied to user permissions
- Secure upload/download with proper validation

### Database Security

- PostgreSQL with Row Level Security (RLS) policies
- User data isolated by organization/client
- Audit trails for all sensitive operations
