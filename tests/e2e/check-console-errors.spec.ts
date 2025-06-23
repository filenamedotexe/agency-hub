import { test } from "@playwright/test";

test("check console errors on clients page", async ({ page }) => {
  // Capture all console messages
  const consoleMessages = [];
  page.on("console", (msg) => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  // Go to login
  await page.goto("http://localhost:3001/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  // Go to clients page
  await page.goto("http://localhost:3001/clients");
  await page.waitForTimeout(5000);

  // Print all console messages
  console.log("=== Console Messages ===");
  consoleMessages.forEach((msg) => {
    if (msg.type === "error") {
      console.log(`ERROR: ${msg.text}`);
    } else if (msg.type === "warning") {
      console.log(`WARN: ${msg.text}`);
    }
  });

  // Take screenshot
  await page.screenshot({ path: "clients-error-state.png", fullPage: true });
});
