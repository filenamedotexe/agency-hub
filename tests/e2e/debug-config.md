# E2E Test Debugging Configuration Guide

## Running Tests in Debug Mode

### 1. Headed Browser Mode (Default)

All tests run in headed mode by default on port 3001:

```bash
npm run test:e2e
```

### 2. Playwright UI Mode

Interactive debugging with time-travel debugging:

```bash
npm run test:e2e:ui
```

### 3. Debug Specific Test File

```bash
npx playwright test tests/e2e/comprehensive-role-test-suite.spec.ts --headed --debug
```

### 4. VS Code Debugging Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Playwright Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "--headed", "--debug"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Single Test File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "${file}", "--headed", "--debug"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 5. Debugging Tips

#### Server Verification

Always verify server is running before debugging:

```bash
# Kill any existing processes
pkill -f "next dev"

# Start server
PORT=3001 npm run dev &

# Verify it's responding
curl -f http://localhost:3001/login
```

#### Common Debug Commands

```bash
# Run with verbose logging
DEBUG=pw:api npx playwright test --headed

# Run specific test by name
npx playwright test -g "Admin can access all modules" --headed

# Run with video recording
npx playwright test --headed --video=on

# Run with trace viewer
npx playwright test --trace on
npx playwright show-trace
```

#### Breakpoints in Tests

```typescript
// Add debugger statement
test("example test", async ({ page }) => {
  await page.goto("/");
  debugger; // Execution will pause here
  await page.click("button");
});

// Or use page.pause()
test("example test", async ({ page }) => {
  await page.goto("/");
  await page.pause(); // Opens Playwright inspector
  await page.click("button");
});
```

### 6. Environment-Specific Debugging

#### Test Against Different Environments

```bash
# Local development
BASE_URL=http://localhost:3001 npm run test:e2e

# Staging
BASE_URL=https://staging.agency-hub.com npm run test:e2e

# With specific viewport
npx playwright test --headed --viewport-width=375 --viewport-height=667
```

### 7. Troubleshooting Common Issues

#### Loading Spinner Issues

If tests fail due to persistent loading spinners:

```typescript
// Wait for network idle instead of specific elements
await page.waitForLoadState("networkidle");

// Or use a custom wait
await page.waitForTimeout(2000);
```

#### Authentication Issues

```typescript
// Always use the helper functions
import { loginAs, clearSession } from "./helpers/role-auth";

// Clear session before each test
test.beforeEach(async ({ page }) => {
  await clearSession(page);
});
```

#### Flaky Tests

```typescript
// Add retries for flaky tests
test.describe("flaky suite", () => {
  test.describe.configure({ retries: 2 });

  test("potentially flaky test", async ({ page }) => {
    // test code
  });
});
```

### 8. Performance Debugging

```bash
# Generate performance metrics
npx playwright test --reporter=html

# Profile test execution
npx playwright test --profile
```

### 9. Screenshot Debugging

```typescript
// Take screenshots at key points
await page.screenshot({ path: "debug-1.png" });

// Full page screenshots
await page.screenshot({ path: "fullpage.png", fullPage: true });

// Element screenshots
await page.locator(".error-message").screenshot({ path: "error.png" });
```

### 10. Network Debugging

```typescript
// Log all network requests
page.on("request", (request) => {
  console.log(">>", request.method(), request.url());
});

page.on("response", (response) => {
  console.log("<<", response.status(), response.url());
});

// Mock network responses for testing
await page.route("**/api/clients", (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ clients: [] }),
  });
});
```
