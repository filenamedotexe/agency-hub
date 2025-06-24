import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";

test.describe("Forms Auth Debug", () => {
  test("Check auth context on forms page", async ({ page }) => {
    // Login
    await loginAsRole(page, "ADMIN");

    // Go to forms page
    await page.goto("/forms");
    await page.waitForTimeout(3000);

    // Try to get auth context from the page
    const authState = await page.evaluate(() => {
      // Try to access React fiber to get component state
      const rootElement =
        document.getElementById("__next") || document.getElementById("root");
      if (!rootElement) return { error: "No root element" };

      // Check localStorage for auth tokens
      const localStorage = window.localStorage;
      const authKeys = Object.keys(localStorage).filter(
        (key) =>
          key.includes("auth") ||
          key.includes("supabase") ||
          key.includes("token")
      );

      return {
        localStorage: authKeys.map((key) => ({
          key,
          value: localStorage.getItem(key)?.substring(0, 50),
        })),
        cookies: document.cookie,
        hasUser: !!(window as any).user,
      };
    });

    console.log("Auth state:", JSON.stringify(authState, null, 2));

    // Check if we can manually trigger a re-render
    await page.evaluate(() => {
      // Try to find React and force update
      const event = new Event("storage");
      window.dispatchEvent(event);
    });

    await page.waitForTimeout(2000);

    // Check again after triggering storage event
    const hasContent = (await page.locator("h1").count()) > 0;
    console.log("Has h1 after storage event:", hasContent);

    // Try navigation via click instead of goto
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Look for Forms link in nav
    const formsLink = page.locator("nav a[href='/forms']").first();
    if (await formsLink.isVisible()) {
      console.log("Found forms link in nav, clicking...");
      await formsLink.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Check if page rendered after navigation
      const hasH1 = (await page.locator("h1").count()) > 0;
      const h1Text = hasH1
        ? await page.locator("h1").first().textContent()
        : "No h1";
      console.log("After nav click - Has h1:", hasH1, "Text:", h1Text);
    } else {
      console.log("Forms link not visible in nav");
    }
  });
});
