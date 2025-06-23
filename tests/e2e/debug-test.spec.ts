import { test, expect } from "@playwright/test";

test("debug application loading", async ({ page }) => {
  // Capture console logs and errors
  const logs: string[] = [];
  const errors: string[] = [];

  page.on("console", (msg) => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    errors.push(err.message);
  });

  // Try to load the home page
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });

  console.log("Response status:", response?.status());
  console.log("Console logs:", logs);
  console.log("Page errors:", errors);

  // Take a screenshot for debugging
  await page.screenshot({ path: "debug-home.png" });

  // Check if any content loaded
  const bodyText = await page.textContent("body");
  console.log("Body text:", bodyText?.substring(0, 200));

  // Try login page
  const loginResponse = await page.goto("/login", {
    waitUntil: "domcontentloaded",
  });
  console.log("Login page status:", loginResponse?.status());

  await page.screenshot({ path: "debug-login.png" });

  // Basic assertion to make test pass/fail
  expect(response?.status()).toBeLessThan(500);
});
