import { test, expect } from "@playwright/test";

test("Can reach login page", async ({ page }) => {
  console.log("1. Going to login page...");
  await page.goto("/login");

  console.log("2. Current URL:", page.url());

  // Take screenshot
  await page.screenshot({ path: "simple-login-test.png" });

  // Check what's on the page
  const bodyText = await page.textContent("body");
  console.log(
    "3. Page content (first 200 chars):",
    bodyText?.substring(0, 200)
  );

  // Count elements
  const inputs = await page.locator("input").count();
  console.log("4. Number of inputs:", inputs);

  const buttons = await page.locator("button").count();
  console.log("5. Number of buttons:", buttons);

  expect(page.url()).toContain("/login");
});
