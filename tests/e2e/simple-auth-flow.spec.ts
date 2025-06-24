import { test, expect } from "@playwright/test";

test("Simple auth flow", async ({ page }) => {
  // Step 1: Login
  console.log("1. Going to login...");
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');

  console.log("2. Waiting for redirect...");
  await page.waitForURL("/dashboard", { timeout: 15000 });
  console.log("3. Successfully reached dashboard!");

  // Step 2: Try to navigate to clients
  console.log("4. Navigating to /clients...");
  await page.goto("/clients");

  console.log("5. Current URL:", page.url());

  // Wait a bit for page to settle
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: "simple-clients-test.png" });

  // Check page state
  const pageState = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      hasSpinner: document.querySelector(".animate-spin") !== null,
      bodyClasses: document.body.className,
      mainExists: document.querySelector("main") !== null,
      h1Text: document.querySelector("h1")?.textContent || "No h1 found",
    };
  });

  console.log("6. Page state:", JSON.stringify(pageState, null, 2));

  // If there's a spinner, wait longer
  if (pageState.hasSpinner) {
    console.log("7. Spinner detected, waiting 5 more seconds...");
    await page.waitForTimeout(5000);

    const pageStateAfterWait = await page.evaluate(() => {
      return {
        hasSpinner: document.querySelector(".animate-spin") !== null,
        mainExists: document.querySelector("main") !== null,
        h1Text: document.querySelector("h1")?.textContent || "No h1 found",
      };
    });

    console.log(
      "8. Page state after wait:",
      JSON.stringify(pageStateAfterWait, null, 2)
    );
  }

  expect(page.url()).toContain("/clients");
});
