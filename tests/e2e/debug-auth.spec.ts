import { test, expect } from "@playwright/test";

test.describe("Debug Authentication", () => {
  test("Check auth state with console logs", async ({ page }) => {
    // Capture console messages
    const consoleLogs: string[] = [];
    page.on("console", (msg: any) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on("pageerror", (error: Error) => {
      pageErrors.push(error.message);
    });

    // Login directly
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL("/dashboard", { timeout: 15000 });
    console.log("✅ Login successful, redirected to dashboard");

    // Check cookies
    const cookies = await page.context().cookies();
    console.log(
      "🍪 Cookies:",
      cookies.map((c: any) => ({ name: c.name, domain: c.domain }))
    );

    // Clear console logs from login
    consoleLogs.length = 0;
    pageErrors.length = 0;

    // Now navigate to clients
    console.log("🚀 Navigating to /clients...");
    await page.goto("/clients");
    console.log("📍 Navigated to:", page.url());

    // Wait a bit
    await page.waitForTimeout(3000);

    // Print console logs
    console.log("\n📋 Console logs:");
    consoleLogs.forEach((log) => console.log(log));

    // Print page errors
    if (pageErrors.length > 0) {
      console.log("\n❌ Page errors:");
      pageErrors.forEach((err) => console.log(err));
    }

    // Check what's on the page
    const bodyText = await page.textContent("body");
    console.log(
      "\n📄 Page content (first 200 chars):",
      bodyText?.substring(0, 200)
    );

    // Check for spinners
    const spinners = await page.locator(".animate-spin").count();
    console.log("🔄 Number of spinners:", spinners);

    // Check for main content
    const hasMain = await page.locator("main").count();
    console.log("📦 Has main element:", hasMain);

    // Check for any headings
    const headings = await page.locator("h1, h2, h3").count();
    console.log("📝 Number of headings:", headings);

    // Execute JavaScript to check auth state
    const authState = await page.evaluate(() => {
      // Check if window has any auth-related data
      return {
        hasSupabase: typeof (window as any).supabase !== "undefined",
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage),
      };
    });
    console.log("\n🔐 Client-side auth state:", authState);

    // Take screenshot
    await page.screenshot({ path: "debug-auth-clients.png" });
    console.log("📸 Screenshot saved as debug-auth-clients.png");
  });
});
