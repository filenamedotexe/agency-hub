# Auth Bypass Solution for Playwright Tests

## Problem

Playwright tests were getting stuck on loading spinners when navigating to protected pages because:

1. The `AuthProvider` component starts with `isLoading=true`
2. It makes async calls to Supabase to check authentication
3. In test environments, these calls were slow or failing
4. The `ProtectedRoute` component shows a spinner while `isLoading=true`

## Solution

We implemented a test-only auth bypass that skips all authentication checks when a special cookie is present.

### Implementation

1. **Set Test Cookie** (in test files):

```typescript
test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "test-auth-bypass",
      value: "true",
      domain: "localhost",
      path: "/",
    },
  ]);
});
```

2. **ProtectedRoute Component** checks for the cookie:

```typescript
// src/components/auth/protected-route.tsx
const isTestMode = typeof window !== "undefined" &&
  document.cookie.includes("test-auth-bypass=true");

// Skip auth checks and loading spinner in test mode
if (isTestMode) {
  return <>{children}</>;
}
```

3. **AuthProvider Component** provides a mock user in test mode:

```typescript
// src/components/providers/auth-provider.tsx
const isTestMode =
  typeof window !== "undefined" &&
  document.cookie.includes("test-auth-bypass=true");

// In test mode, immediately set a mock admin user
if (isTestMode) {
  setSession({
    user: {
      id: "test-user",
      email: "admin@example.com",
      role: "ADMIN",
    },
    isLoading: false,
    error: null,
  });
  return;
}
```

## Usage Example

```typescript
import { test, expect } from "@playwright/test";

test("Navigate to protected page", async ({ page, context }) => {
  // Set bypass cookie
  await context.addCookies([
    {
      name: "test-auth-bypass",
      value: "true",
      domain: "localhost",
      path: "/",
    },
  ]);

  // Navigate directly - no login needed
  await page.goto("/clients");
  expect(page.url()).toContain("/clients");
});
```

## Benefits

- No loading spinners in tests
- No need to perform actual login
- Tests run faster
- No dependency on Supabase in tests
- Simple and reliable

## Limitations

- Only bypasses UI authentication
- API calls still require real auth (form submissions won't work)
- Should only be used for UI/navigation testing
