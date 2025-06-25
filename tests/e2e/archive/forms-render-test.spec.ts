import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";

test.describe("Forms Page Rendering", () => {
  test("Debug React rendering issue", async ({ page }) => {
    // Capture all console messages
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    // Login
    await loginAsRole(page, "ADMIN");

    // Clear captured messages from login
    consoleMessages.length = 0;
    pageErrors.length = 0;

    // Navigate to forms
    console.log("Navigating to /forms...");
    await page.goto("/forms", { waitUntil: "domcontentloaded" });

    // Wait a bit for any errors to appear
    await page.waitForTimeout(3000);

    // Print all console messages
    console.log("\n=== Console Messages ===");
    consoleMessages.forEach((msg) => console.log(msg));

    console.log("\n=== Page Errors ===");
    pageErrors.forEach((err) => console.log(err));

    // Check if main element exists
    const mainElement = await page.locator("main").count();
    console.log("\nHas <main> element:", mainElement > 0);

    // Check if any React root exists
    const reactRoot = await page
      .locator("#__next, #root, [data-reactroot]")
      .count();
    console.log("Has React root:", reactRoot > 0);

    // Check raw HTML
    const htmlContent = await page.content();
    const hasReactScript =
      htmlContent.includes("_next") || htmlContent.includes("react");
    console.log("Has React/Next.js scripts:", hasReactScript);

    // Try to execute JavaScript
    try {
      const jsResult = await page.evaluate(() => {
        return {
          hasWindow: typeof window !== "undefined",
          hasReact: typeof (window as any).React !== "undefined",
          hasNext: typeof (window as any).__NEXT_DATA__ !== "undefined",
          nextData: (window as any).__NEXT_DATA__,
          documentReady: document.readyState,
        };
      });
      console.log("\nJavaScript context:", jsResult);
    } catch (e) {
      console.log("Failed to evaluate JS:", e);
    }

    // Check network failures
    const failedRequests: string[] = [];
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    // Reload to capture any failed requests
    await page.reload({ waitUntil: "networkidle" });

    if (failedRequests.length > 0) {
      console.log("\n=== Failed Requests ===");
      failedRequests.forEach((req) => console.log(req));
    }

    // Final check - is there any visible text?
    const visibleText = await page.locator("body").innerText();
    console.log("\nVisible text length:", visibleText.length);
    console.log("First 200 chars:", visibleText.substring(0, 200));
  });
});
