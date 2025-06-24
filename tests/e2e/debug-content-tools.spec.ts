import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";

test.describe("Debug Content Tools Issues", () => {
  test("🔍 Debug Content Tools Access Step by Step", async ({ page }) => {
    console.log("🧪 Starting debug of content tools...");

    // Step 1: Test login works
    console.log("Step 1: Testing login...");
    await loginAsRole(page, "ADMIN");
    console.log("✅ Login completed successfully");

    // Step 2: Check if we can access dashboard first
    console.log("Step 2: Testing dashboard access...");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const dashboardTitle = await page.title();
    console.log(`Dashboard title: ${dashboardTitle}`);

    const currentUrl = page.url();
    console.log(`Current URL after dashboard: ${currentUrl}`);

    if (currentUrl.includes("/dashboard")) {
      console.log("✅ Dashboard access successful");
    } else {
      console.log("❌ Dashboard access failed");
    }

    // Step 3: Check sidebar navigation
    console.log("Step 3: Checking sidebar navigation...");
    const sidebarItems = await page
      .locator("nav a, nav button")
      .allTextContents();
    console.log("Sidebar items:", sidebarItems);

    // Step 4: Try content tools navigation
    console.log("Step 4: Testing content tools navigation...");

    // Look for content tools link in sidebar
    const contentToolsLink = page.locator(
      'a[href="/content-tools"], a:has-text("Content Tools")'
    );
    const linkCount = await contentToolsLink.count();

    if (linkCount > 0) {
      console.log("✅ Found content tools link in sidebar");
      await contentToolsLink.first().click();
      await page.waitForLoadState("networkidle");
    } else {
      console.log(
        "❌ No content tools link found, trying direct navigation..."
      );
      await page.goto("/content-tools");
      await page.waitForLoadState("networkidle");
    }

    // Step 5: Check final URL and page content
    const finalUrl = page.url();
    const finalTitle = await page.title();
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Final title: ${finalTitle}`);

    // Take screenshot
    await page.screenshot({ path: "debug-content-tools.png", fullPage: true });
    console.log("📸 Screenshot saved as debug-content-tools.png");

    // Check what's actually on the page
    const headings = await page.locator("h1, h2, h3").allTextContents();
    console.log("Headings on page:", headings);

    const pageText = await page.locator("body").textContent();
    console.log("Page text preview:", pageText?.substring(0, 500) + "...");

    // Check for error messages
    const errorElements = page.locator(
      'text="Error", text="Failed", text="Not found", text="Unauthorized"'
    );
    const errorCount = await errorElements.count();

    if (errorCount > 0) {
      console.log("❌ Found error messages:");
      const errors = await errorElements.allTextContents();
      console.log(errors);
    }

    // Check browser console for errors
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        logs.push(`Console Error: ${msg.text()}`);
      }
    });

    // Refresh to trigger any console errors
    await page.reload();
    await page.waitForLoadState("networkidle");

    if (logs.length > 0) {
      console.log("❌ Console errors found:");
      logs.forEach((log) => console.log(log));
    }

    console.log("🔍 Debug complete");
  });

  test("🔧 Test Manual Navigation to Content Tools", async ({ page }) => {
    console.log("🧪 Testing manual navigation...");

    await loginAsRole(page, "ADMIN");

    // Try different approaches to get to content tools
    const routes = [
      "/content-tools",
      "/(dashboard)/content-tools",
      "/dashboard/content-tools",
    ];

    for (const route of routes) {
      console.log(`Trying route: ${route}`);
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const url = page.url();
      const title = await page.title();

      console.log(`  URL: ${url}`);
      console.log(`  Title: ${title}`);

      if (url.includes("content-tools") && !url.includes("login")) {
        console.log("✅ Success with route:", route);
        break;
      } else {
        console.log("❌ Failed with route:", route);
      }
    }
  });

  test("🎯 Test Specific Content Tools API", async ({ page }) => {
    console.log("🧪 Testing content tools API...");

    await loginAsRole(page, "ADMIN");

    // Test API endpoint directly
    const response = await page.request.get("/api/content-tools");
    const status = response.status();
    console.log(`API status: ${status}`);

    if (status === 200) {
      const data = await response.json();
      console.log(`Found ${data.length} content tools`);
      console.log(
        "Tools:",
        data.map((t: any) => t.name)
      );
    } else {
      const error = await response.text();
      console.log("API Error:", error);
    }

    // Test with browser navigation to see client-side issues
    await page.goto("/content-tools");
    await page.waitForTimeout(5000); // Give extra time

    // Check if page eventually loads
    const headings = await page.locator("h1, h2, h3").allTextContents();
    console.log("Final headings:", headings);

    // Look for loading states
    const loadingElements = page.locator(
      'text="Loading", text="Fetching", [data-loading]'
    );
    const loadingCount = await loadingElements.count();

    if (loadingCount > 0) {
      console.log("⏳ Page seems to be loading...");
      await page.waitForTimeout(5000);
    }

    console.log("🎯 API test complete");
  });
});
