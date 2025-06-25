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
