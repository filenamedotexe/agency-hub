import { test, expect } from "@playwright/test";

test("Debug: What renders on clients page", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill('input[name="email"]', "admin@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard");

  // Go to clients page
  await page.goto("/clients");
  await page.waitForTimeout(2000);

  // Get the entire body HTML
  const bodyHTML = await page.locator("body").innerHTML();
  console.log("Body HTML length:", bodyHTML.length);

  // Check for specific elements
  const hasMain = await page.locator("main").count();
  const hasDiv = await page.locator("div").count();
  const hasH1 = await page.locator("h1").count();

  console.log("Element counts:", {
    main: hasMain,
    div: hasDiv,
    h1: hasH1,
  });

  // Get text content
  const textContent = await page.locator("body").textContent();
  console.log("Page text:", textContent?.substring(0, 500));

  // Check if there's an error boundary
  const hasError = bodyHTML.includes("error") || bodyHTML.includes("Error");
  console.log("Has error text:", hasError);

  // Check if React is rendering anything
  const hasReactRoot = await page.locator("#__next").count();
  console.log("Has React root:", hasReactRoot);
});
