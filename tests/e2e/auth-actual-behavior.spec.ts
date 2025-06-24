import { test, expect } from "@playwright/test";

test.describe("Authentication - What Actually Works", () => {
  test("Users can login and get redirected to correct dashboard", async ({
    page,
  }) => {
    // Test admin login
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL("/dashboard", { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");
    console.log("✅ Admin login works and redirects to /dashboard");

    // Clear for next test
    await page.context().clearCookies();

    // Test client login
    await page.goto("/login");
    await page.fill('input[type="email"]', "client@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should redirect to client dashboard
    await page.waitForURL("/client-dashboard", { timeout: 10000 });
    expect(page.url()).toContain("/client-dashboard");
    console.log("✅ Client login works and redirects to /client-dashboard");
  });

  test("Invalid credentials are rejected", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should stay on login page
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
    console.log("✅ Invalid credentials keep user on login page");
  });

  test("Protected pages redirect to login when not authenticated", async ({
    page,
  }) => {
    // Make sure we're logged out
    await page.context().clearCookies();

    // Try to access protected page
    await page.goto("/dashboard");

    // Should redirect to login
    await page.waitForURL("/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");
    console.log("✅ Unauthenticated users are redirected to login");
  });

  test("Session persists across page navigations", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Navigate to different pages
    await page.goto("/services");
    expect(page.url()).toContain("/services");

    await page.goto("/clients");
    expect(page.url()).toContain("/clients");

    // Should not be redirected to login
    expect(page.url()).not.toContain("/login");
    console.log("✅ Session persists across navigation");
  });

  test("Menu shows different items based on user role", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Check for Settings menu item (admin only)
    const settingsLink = page.locator('nav a:has-text("Settings")').first();
    const settingsVisible = await settingsLink.isVisible({ timeout: 2000 });
    console.log(`Admin sees Settings: ${settingsVisible}`);

    // Logout
    await page.context().clearCookies();

    // Login as copywriter
    await page.goto("/login");
    await page.fill('input[type="email"]', "copywriter@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Settings should NOT be visible for copywriter
    const settingsLinkCopywriter = page
      .locator('nav a:has-text("Settings")')
      .first();
    const settingsVisibleCopywriter = await settingsLinkCopywriter.isVisible({
      timeout: 1000,
    });
    console.log(`Copywriter sees Settings: ${settingsVisibleCopywriter}`);

    expect(settingsVisibleCopywriter).toBe(false);
    console.log("✅ Menu items are filtered by role (UI level only)");
  });

  test("CRITICAL BUG: No server-side access control", async ({ page }) => {
    // Login as copywriter
    await page.goto("/login");
    await page.fill('input[type="email"]', "copywriter@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Try to access admin-only settings page
    await page.goto("/settings");
    await page.waitForLoadState("domcontentloaded");

    // BUG: Copywriter CAN access settings
    expect(page.url()).toContain("/settings");

    // Document the security issue
    await page.screenshot({
      path: "test-results/SECURITY-BUG-copywriter-accessing-settings.png",
      fullPage: true,
    });

    console.log("❌ CRITICAL SECURITY BUG CONFIRMED:");
    console.log("   - Copywriter can access /settings (admin-only page)");
    console.log("   - Role-based access control is NOT enforced server-side");
    console.log("   - Only menu visibility is restricted (client-side only)");
    console.log("   - See middleware.ts lines 123-126: role check is disabled");
  });
});
