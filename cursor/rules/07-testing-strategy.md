# Testing Strategy

## Overview

- **CRITICAL**: Always verify server responds before testing: `curl -f http://localhost:3001`
- **Unit tests**: Utilities and hooks with Vitest
- **Integration tests**: API routes with Vitest
- **E2E tests**: Critical user flows with Playwright (headed, real UI interaction)
- **Visual regression**: Screenshots and component testing
- **Test selectors**: Use `page.locator().filter()` patterns, not `page.click('text=')`
- **Port consistency**: All tests run against localhost:3001
- **Server verification**: Never assume server is running - always HTTP test first

## E2E Test Best Practices

### Avoid Common Pitfalls

- **Avoid strict element visibility checks**: Tests should not fail on `toBeVisible` for specific elements that may render differently in test environments
- **Focus on navigation success**: Verify URL changes and page loads rather than specific UI elements
- **Use waitForLoadState**: Prefer `waitForLoadState('domcontentloaded')` and `waitForLoadState('networkidle')` over waiting for specific elements
- **Handle loading states gracefully**: Don't fail tests because of loading spinners - they may persist longer in test environments

### Common Test Pattern for Page Navigation

```typescript
await page.goto("/target-page");
await page.waitForLoadState("domcontentloaded");
await page.waitForLoadState("networkidle");
expect(page.url()).toContain("/target-page");
```

### Known Issues

- React Server Component (RSC) requests may fail with `net::ERR_ABORTED` in tests - this is expected and shouldn't fail tests
- Loading spinners may persist longer in test environments than in manual testing
- The `<main>` element or specific heading tags may not be immediately available in test environments

## Test Organization

### Test File Structure

```
tests/
  e2e/
    01-authentication.spec.ts
    02-client-management.spec.ts
    03-services-tasks.spec.ts
    04-forms-dynamic-fields.spec.ts
    05-requests-webhooks.spec.ts
    06-content-tools.spec.ts
    07-settings.spec.ts
    08-attachments.spec.ts
    09-visual-regression.spec.ts
    10-accessibility.spec.ts
    11-network-monitoring.spec.ts
    helpers/
      auth.ts
      role-auth.ts
      mcp-utils.ts
  unit/
    components/
    services/
    utils/
```

### Test Categories

1. **Authentication Flow**: Login, logout, role-based access
2. **Client Management**: CRUD operations, form responses
3. **Services & Tasks**: Templates, assignments, checklists
4. **Forms**: Builder, dynamic fields, submissions
5. **Requests**: Duda webhooks, comment threading
6. **Content Tools**: AI generation, webhook integration
7. **Settings**: API keys, team management, webhooks
8. **Attachments**: File upload, management, storage
9. **Visual Regression**: UI consistency across browsers
10. **Accessibility**: WCAG compliance, screen readers
11. **Network Monitoring**: Performance, API response times

## Unit Testing

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComponentToTest } from './component-to-test'

describe('ComponentToTest', () => {
  beforeEach(() => {
    // Setup
  })

  it('should render correctly', () => {
    render(<ComponentToTest />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    // Test user interactions
  })
})
```

### What to Test

- **Components**: Props, state changes, user interactions
- **Utilities**: Pure functions, data transformations
- **Hooks**: Custom hooks with different inputs
- **Services**: Business logic, API calls (mocked)
- **Validations**: Zod schemas, form validation

## Integration Testing

### API Route Testing

```typescript
import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/clients/route";

describe("/api/clients", () => {
  it("should create a new client", async () => {
    const request = new Request("http://localhost:3001/api/clients", {
      method: "POST",
      body: JSON.stringify({ name: "Test Client" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

### Database Testing

- Use test database for integration tests
- Clean up test data after each test
- Mock external services (Supabase, AI APIs)

## Visual Regression Testing

### Screenshot Testing

```typescript
import { test, expect } from "@playwright/test";

test("dashboard visual regression", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("dashboard.png");
});
```

### Cross-Browser Testing

- Chrome (primary development browser)
- Firefox (secondary testing)
- Safari (if needed for specific features)

## Performance Testing

### Lighthouse Integration

```typescript
test("performance audit", async ({ page }) => {
  await page.goto("/dashboard");

  // Run Lighthouse audit
  const report = await lighthouse(page.url(), {
    port: 9222,
    output: "json",
  });

  expect(report.categories.performance.score).toBeGreaterThan(0.8);
});
```

### Load Testing

- Test with multiple concurrent users
- Monitor database performance
- Check API response times

## Test Data Management

### Fixtures

```typescript
// tests/fixtures/users.ts
export const testUsers = {
  admin: {
    email: "admin@test.com",
    role: "admin",
  },
  serviceManager: {
    email: "manager@test.com",
    role: "service_manager",
  },
};
```

### Seed Data

- Consistent test data across environments
- Isolated test data per test suite
- Cleanup mechanisms for test data
