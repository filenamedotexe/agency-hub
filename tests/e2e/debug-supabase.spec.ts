import { test, expect } from "@playwright/test";

test.describe("Debug Supabase Client", () => {
  test("Check Supabase initialization", async ({ page }) => {
    // Go directly to login page
    await page.goto("/login");

    // Check if Supabase is initialized on login page
    const loginPageState = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasSupabaseInWindow: typeof (window as any).supabase !== "undefined",
      };
    });
    console.log("🔍 Login page state:", loginPageState);

    // Login
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL("/dashboard", { timeout: 15000 });

    // Check dashboard state
    const dashboardState = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasSupabaseInWindow: typeof (window as any).supabase !== "undefined",
      };
    });
    console.log("🔍 Dashboard state:", dashboardState);

    // Navigate to clients
    await page.goto("/clients");
    await page.waitForTimeout(2000);

    // Check clients page state and try to access auth
    const clientsPageState = await page.evaluate(async () => {
      const result: any = {
        url: window.location.href,
        hasSupabaseInWindow: typeof (window as any).supabase !== "undefined",
      };

      // Try to create Supabase client directly
      try {
        const { createBrowserClient } = await import("@supabase/ssr");
        const client = createBrowserClient(
          "https://rznvmbxhfnyqcyanxptq.supabase.co",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bnZtYnhoZm55cWN5YW54cHRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NzQ5MTUsImV4cCI6MjA2NjE1MDkxNX0.HOH4eUFgX2joRUHtbnaLAUZ5LdkrSlmFX0yVv79REHU"
        );

        const {
          data: { user },
        } = await client.auth.getUser();
        result.manualSupabaseUser = user
          ? { id: user.id, email: user.email }
          : null;
      } catch (e) {
        result.manualSupabaseError = (e as Error).message;
      }

      return result;
    });
    console.log("🔍 Clients page state:", clientsPageState);
  });
});
