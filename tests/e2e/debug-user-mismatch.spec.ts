import { test, expect } from "@playwright/test";

test.describe("Debug User Mismatch", () => {
  test("🔍 Check User ID Mismatch", async ({ page }) => {
    console.log("🧪 Testing user authentication mismatch...");

    // Step 1: Login
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    console.log("Current URL after login:", page.url());

    // Step 2: Check current user via debug API
    const response = await page.goto("/api/debug/current-user");
    const userInfo = await response?.json();

    console.log("🔍 Current user info:", JSON.stringify(userInfo, null, 2));

    if (userInfo.authUser && userInfo.dbUser) {
      console.log("✅ User found in both auth and database");
      console.log("Auth ID:", userInfo.authUser.id);
      console.log("DB ID:", userInfo.dbUser.id);
      console.log("Role:", userInfo.dbUser.role);
    } else if (userInfo.authUser && !userInfo.dbUser) {
      console.log("❌ MISMATCH: User found in auth but NOT in database");
      console.log("Auth User ID:", userInfo.authUser.id);
      console.log("Auth Email:", userInfo.authUser.email);
      console.log("DB Error:", userInfo.dbError);
    } else if (!userInfo.authUser) {
      console.log("❌ ISSUE: No authenticated user found");
    }

    // Step 3: Try to access content tools
    await page.goto("/content-tools");
    await page.waitForTimeout(2000);

    const pageContent = await page.locator("body").textContent();
    const hasContent = pageContent?.includes("Content Tools - Debug Test");

    console.log("Content tools page loaded:", hasContent ? "✅ YES" : "❌ NO");
    if (!hasContent) {
      console.log("Page content preview:", pageContent?.substring(0, 200));
    }
  });
});
