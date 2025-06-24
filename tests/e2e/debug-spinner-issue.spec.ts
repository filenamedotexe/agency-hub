import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";

test.describe("Debug Spinner Loading Issue", () => {
  test("🐛 Find JavaScript Errors Causing Infinite Loading", async ({
    page,
  }) => {
    console.log("🔍 Debugging the infinite spinner issue...");

    // Capture console errors
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`Console Error: ${msg.text()}`);
        console.log(`❌ Console Error: ${msg.text()}`);
      }
      if (msg.type() === "warning") {
        console.log(`⚠️ Console Warning: ${msg.text()}`);
      }
    });

    page.on("response", (response) => {
      if (!response.ok()) {
        networkErrors.push(
          `Network Error: ${response.status()} ${response.url()}`
        );
        console.log(`❌ Network Error: ${response.status()} ${response.url()}`);
      }
    });

    // Login first
    await loginAsRole(page, "ADMIN");

    // Navigate to content tools
    console.log("🧪 Navigating to content tools...");
    await page.goto("/content-tools");

    // Wait and see what happens
    console.log("⏳ Waiting for initial load...");
    await page.waitForTimeout(3000);

    // Check if still loading
    const loadingText = page.locator('text="Loading content tools..."');
    const isStillLoading = await loadingText.isVisible();

    if (isStillLoading) {
      console.log("❌ Page is stuck loading!");

      // Check network tab
      console.log("🌐 Checking API call...");
      const apiResponse = await page
        .waitForResponse("/api/content-tools", { timeout: 5000 })
        .catch(() => null);

      if (apiResponse) {
        console.log(`✅ API responded with status: ${apiResponse.status()}`);
        const responseData = await apiResponse
          .json()
          .catch(() => "Failed to parse JSON");
        console.log("API Response:", responseData);
      } else {
        console.log("❌ No API response received");
      }

      // Check React errors
      console.log("⚛️ Checking React component state...");

      // Check if React even loaded
      const reactLoaded = await page
        .evaluate(() => {
          return (
            typeof window.React !== "undefined" ||
            typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !==
              "undefined"
          );
        })
        .catch(() => false);

      console.log(`React loaded: ${reactLoaded}`);

      // Check if fetch completed
      const fetchResult = await page.evaluate(async () => {
        try {
          const response = await fetch("/api/content-tools");
          const data = await response.json();
          return { success: true, count: data.length };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });

      console.log("Manual fetch result:", fetchResult);
    } else {
      console.log("✅ Page loaded successfully");
    }

    // Print all collected errors
    if (consoleErrors.length > 0) {
      console.log("\n❌ JavaScript Errors Found:");
      consoleErrors.forEach((error) => console.log(error));
    }

    if (networkErrors.length > 0) {
      console.log("\n❌ Network Errors Found:");
      networkErrors.forEach((error) => console.log(error));
    }

    if (consoleErrors.length === 0 && networkErrors.length === 0) {
      console.log("✅ No errors found - issue might be elsewhere");
    }

    // Take a screenshot for visual debugging
    await page.screenshot({ path: "spinner-debug.png", fullPage: true });
    console.log("📸 Screenshot saved as spinner-debug.png");
  });

  test("🔧 Try Force Loading Content Tools", async ({ page }) => {
    console.log("🔧 Attempting to force load content tools...");

    await loginAsRole(page, "ADMIN");

    // Navigate and inject debug code
    await page.goto("/content-tools");

    // Wait a bit
    await page.waitForTimeout(2000);

    // Try to force the loading state to false via JavaScript injection
    console.log("💉 Injecting debug code...");

    const result = await page.evaluate(() => {
      // Try to find React component instance and force update
      const contentToolsElement = document.querySelector(
        '[data-testid="content-tools"], main, .space-y-6'
      );

      if (contentToolsElement) {
        // Try to trigger a re-render by modifying the DOM
        const loadingDiv = document.querySelector(
          'text="Loading content tools..."'
        )?.parentElement;
        if (loadingDiv) {
          loadingDiv.innerHTML =
            "<h1>Content Tools</h1><p>Forced load for debugging</p>";
          return "Forced content injection";
        }
      }

      return "No loading element found to replace";
    });

    console.log("Injection result:", result);

    await page.waitForTimeout(1000);

    // Check what's visible now
    const headings = await page.locator("h1, h2, h3").allTextContents();
    console.log("Visible headings after injection:", headings);
  });
});
