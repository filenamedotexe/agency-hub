import { test, expect } from "@playwright/test";

test.describe("Phase 3 Final Verification", () => {
  test.beforeEach(async ({ context }) => {
    // Set test bypass cookie
    await context.addCookies([
      {
        name: "test-auth-bypass",
        value: "true",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("All Phase 3 UI components load correctly", async ({ page }) => {
    // 1. Clients list page loads
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/clients");
    await expect(page.locator('button:has-text("Add Client")')).toBeVisible();

    // 2. New client form loads with all fields
    await page.goto("/clients/new");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/clients/new");
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    await expect(page.locator('textarea[name="address"]')).toBeVisible();
    await expect(page.locator('input[name="dudaSiteId"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // 3. Dashboard loads
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/dashboard");

    // 4. Services page loads
    await page.goto("/services");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/services");
  });
});

// Document the solution
test.describe("Auth Bypass Solution Documentation", () => {
  test("How the auth bypass works", async ({ page }) => {
    // The solution has 3 parts:

    // 1. Set a test-auth-bypass cookie before navigation
    await page.context().addCookies([
      {
        name: "test-auth-bypass",
        value: "true",
        domain: "localhost",
        path: "/",
      },
    ]);

    // 2. ProtectedRoute component checks for this cookie and skips auth
    // See: src/components/auth/protected-route.tsx lines 23-47

    // 3. AuthProvider also checks for the cookie and provides a mock user
    // See: src/components/providers/auth-provider.tsx lines 20-44

    // This allows tests to navigate protected pages without dealing with
    // Supabase auth or loading spinners

    await page.goto("/clients");
    expect(page.url()).toContain("/clients");
  });
});
