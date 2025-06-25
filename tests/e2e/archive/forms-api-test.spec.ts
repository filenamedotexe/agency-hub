import { test, expect } from "@playwright/test";
import { loginAsRole } from "./helpers/role-auth";

test.describe("Forms API Test", () => {
  test("Check forms API endpoint", async ({ page }) => {
    // Login as admin first
    await loginAsRole(page, "ADMIN");

    // Test the forms API directly
    const response = await page.request.get("/api/forms");
    console.log("Forms API status:", response.status());

    if (response.ok()) {
      const data = await response.json();
      console.log("Forms count:", data.length);
      console.log("First form:", data[0]);
    } else {
      console.log("API Error:", await response.text());
    }

    // Now navigate to forms page
    await page.goto("/forms");
    await page.waitForLoadState("networkidle");

    // Wait longer for content to load
    await page.waitForTimeout(5000);

    // Check what's on the page
    const pageContent = await page.locator("body").innerText();
    console.log("Page has content:", pageContent.length > 100);

    // Look for any text that indicates the page loaded
    const hasFormsTitle =
      (await page.locator("h1:has-text('Forms')").count()) > 0;
    const hasCreateButton =
      (await page.locator("text='Create Form'").count()) > 0;
    const hasNoFormsMessage =
      (await page.locator("text='No forms yet'").count()) > 0;
    const hasLoadingMessage =
      (await page.locator("text='Loading forms'").count()) > 0;

    console.log("Page state:", {
      hasFormsTitle,
      hasCreateButton,
      hasNoFormsMessage,
      hasLoadingMessage,
      url: page.url(),
    });

    // Take screenshot
    await page.screenshot({ path: "forms-page-state.png", fullPage: true });
  });
});
