import { test, expect } from "@playwright/test";

test.describe("Test Protected Route Behavior", () => {
  test("check authentication flow in protected route", async ({ page }) => {
    // Monitor console for errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Login
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000,
    });

    console.log("Redirected to:", page.url());

    // Now try to access clients directly
    await page.goto("/clients", { waitUntil: "networkidle" });

    // Wait a bit for any async operations
    await page.waitForTimeout(3000);

    // Check final URL
    console.log("Final URL:", page.url());

    // Check for loading spinner (from ProtectedRoute component)
    const loadingSpinner = await page.locator(".animate-spin").count();
    console.log("Loading spinners found:", loadingSpinner);

    // Check localStorage for auth data
    const authData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const authKeys = keys.filter(
        (k) => k.includes("auth") || k.includes("supabase")
      );
      const data: Record<string, any> = {};
      authKeys.forEach((key) => {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || "null");
        } catch {
          data[key] = localStorage.getItem(key);
        }
      });
      return data;
    });

    console.log("Auth data in localStorage:", Object.keys(authData));

    // Check if useAuth hook is working
    const authState = await page.evaluate(() => {
      // Try to access React DevTools to check component state
      const root = document.getElementById("__next");
      if (!root) return null;

      // This is a hack to try to access React fiber
      const fiberKey = Object.keys(root).find(
        (key) =>
          key.startsWith("__reactInternalInstance") ||
          key.startsWith("__reactFiber")
      );

      return fiberKey ? "React fiber found" : "No React fiber";
    });

    console.log("React state check:", authState);

    // Log any console errors
    if (errors.length > 0) {
      console.log("Console errors:", errors);
    }

    // Final check - is there any content?
    const pageContent = await page.evaluate(() => {
      const main =
        document.querySelector("main") ||
        document.querySelector('[role="main"]') ||
        document.body;
      return {
        hasContent: main.children.length > 0,
        firstChild: main.children[0]?.tagName,
        textContent: main.textContent?.trim().substring(0, 100),
      };
    });

    console.log("Page content:", pageContent);
  });
});
