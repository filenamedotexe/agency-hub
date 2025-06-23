import { test, expect } from "@playwright/test";

test.describe("Debug Clients Page Hydration", () => {
  test("check page hydration and loading states", async ({ page }) => {
    // Enable all console logging
    page.on("console", (msg) => {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    });

    page.on("pageerror", (error) => {
      console.log("Page error:", error);
    });

    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for navigation away from login
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000,
    });

    // Navigate to clients page
    await page.goto("/clients");

    // Wait for React to hydrate - check for any interactive element
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Give React time to hydrate

    // Debug: Take a screenshot
    await page.screenshot({ path: "clients-page-debug.png", fullPage: true });

    // Check what's actually on the page
    const pageTitle = await page.title();
    console.log("Page title:", pageTitle);

    // Check for any visible text
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("Visible text on page:", bodyText);

    // Check if React DevTools are present (indicates React is loaded)
    const hasReact = await page.evaluate(() => {
      return (
        !!(window as any).React ||
        !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
      );
    });
    console.log("React detected:", hasReact);

    // Check for specific elements
    const h1Count = await page.locator("h1").count();
    const tableCount = await page.locator("table").count();
    const buttonCount = await page.locator("button").count();

    console.log({
      h1Count,
      tableCount,
      buttonCount,
    });

    // Try to find any element with "Clients" text
    const clientsElements = await page.locator('*:has-text("Clients")').count();
    console.log("Elements containing 'Clients':", clientsElements);

    // Check network activity
    const failedRequests: string[] = [];
    page.on("requestfailed", (request) => {
      failedRequests.push(request.url());
    });

    await page.waitForTimeout(1000);
    if (failedRequests.length > 0) {
      console.log("Failed requests:", failedRequests);
    }
  });

  test("check if client-side JavaScript is executing", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/login"));

    // Go to clients page
    await page.goto("/clients");

    // Inject a script to check if React components are rendering
    const componentInfo = await page.evaluate(() => {
      // Check if React fiber nodes exist
      const rootElement = document.getElementById("__next");
      const hasFiber = rootElement && "_reactRootContainer" in rootElement;

      // Try to find React components
      const findReactComponent = (elem: Element): any => {
        const key = Object.keys(elem).find(
          (key) =>
            key.startsWith("__reactInternalInstance") ||
            key.startsWith("__reactFiber")
        );
        return key ? (elem as any)[key] : null;
      };

      const components: string[] = [];
      document.querySelectorAll("*").forEach((elem) => {
        const fiber = findReactComponent(elem);
        if (fiber && fiber.elementType && fiber.elementType.name) {
          components.push(fiber.elementType.name);
        }
      });

      return {
        hasFiber,
        components: [...new Set(components)].slice(0, 10), // First 10 unique components
        rootHTML: rootElement?.innerHTML.substring(0, 200),
      };
    });

    console.log("React component info:", componentInfo);
  });
});
