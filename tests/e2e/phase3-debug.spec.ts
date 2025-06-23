import { test, expect } from "@playwright/test";

test.describe("Phase 3 Debug - Check Navigation", () => {
  test.beforeAll(async () => {
    // CRITICAL: Verify server is responding before any tests
    const response = await fetch("http://localhost:3001");
    if (!response.ok) {
      throw new Error("Server not responding on port 3001");
    }
  });

  test("Debug: Check what navigation elements are visible", async ({
    page,
  }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
    await page.waitForLoadState("networkidle");

    // Take a screenshot to see what we have
    await page.screenshot({ path: "debug-dashboard.png", fullPage: true });

    // Check all navigation elements
    console.log("=== DEBUGGING NAVIGATION ===");

    // Check for desktop sidebar
    const desktopSidebar = page.locator(".lg\\:flex.lg\\:w-64");
    console.log("Desktop sidebar visible:", await desktopSidebar.isVisible());

    // Check for navigation links in desktop sidebar
    const desktopNavLinks = page.locator(".lg\\:flex nav a");
    const desktopCount = await desktopNavLinks.count();
    console.log("Desktop nav links count:", desktopCount);

    for (let i = 0; i < desktopCount; i++) {
      const link = desktopNavLinks.nth(i);
      const text = await link.textContent();
      const href = await link.getAttribute("href");
      const visible = await link.isVisible();
      console.log(
        `Desktop link ${i}: "${text}" -> ${href} (visible: ${visible})`
      );
    }

    // Check for all nav-item elements
    const navItems = page.locator(".nav-item");
    const navCount = await navItems.count();
    console.log("Total nav-item elements:", navCount);

    for (let i = 0; i < navCount; i++) {
      const item = navItems.nth(i);
      const text = await item.textContent();
      const href = await item.getAttribute("href");
      const visible = await item.isVisible();
      console.log(`Nav item ${i}: "${text}" -> ${href} (visible: ${visible})`);
    }

    // Check for Services link specifically
    const servicesLinks = page.locator("text=Services");
    const servicesCount = await servicesLinks.count();
    console.log("Services links found:", servicesCount);

    for (let i = 0; i < servicesCount; i++) {
      const link = servicesLinks.nth(i);
      const visible = await link.isVisible();
      const boundingBox = await link.boundingBox();
      console.log(
        `Services link ${i}: visible=${visible}, bounds=${JSON.stringify(boundingBox)}`
      );
    }

    // Check for Clients link specifically
    const clientsLinks = page.locator("text=Clients");
    const clientsCount = await clientsLinks.count();
    console.log("Clients links found:", clientsCount);

    for (let i = 0; i < clientsCount; i++) {
      const link = clientsLinks.nth(i);
      const visible = await link.isVisible();
      const boundingBox = await link.boundingBox();
      console.log(
        `Clients link ${i}: visible=${visible}, bounds=${JSON.stringify(boundingBox)}`
      );
    }

    // Try to click on a visible Services link
    const visibleServicesLink = page.locator('a[href="/services"]').first();
    if (await visibleServicesLink.isVisible()) {
      console.log("Attempting to click Services link...");
      await visibleServicesLink.click();
      await page.waitForLoadState("networkidle");

      const currentUrl = page.url();
      console.log("After clicking Services, URL is:", currentUrl);

      if (currentUrl.includes("/services")) {
        console.log("✅ Successfully navigated to Services page");

        // Check what's on the services page
        const pageTitle = await page.locator("h1").first().textContent();
        console.log("Services page title:", pageTitle);

        const serviceTemplates = page.locator("text=Service Templates");
        console.log(
          "Service Templates visible:",
          await serviceTemplates.isVisible()
        );
      }
    } else {
      console.log("❌ No visible Services link found");
    }

    console.log("=== END DEBUG ===");
  });

  test("Debug: Check client detail page navigation", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
    await page.waitForLoadState("networkidle");

    // Navigate to clients page using href
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    console.log("=== DEBUGGING CLIENTS PAGE ===");

    // Take screenshot
    await page.screenshot({ path: "debug-clients.png", fullPage: true });

    // Check for client cards
    const clientCards = page.locator('[data-testid="client-card"]');
    const cardCount = await clientCards.count();
    console.log("Client cards found:", cardCount);

    if (cardCount > 0) {
      console.log("Clicking first client card...");
      await clientCards.first().click();
      await page.waitForLoadState("networkidle");

      const currentUrl = page.url();
      console.log("Client detail URL:", currentUrl);

      // Take screenshot of client detail page
      await page.screenshot({
        path: "debug-client-detail.png",
        fullPage: true,
      });

      // Check for services section
      const servicesSection = page.locator("text=Services");
      const servicesSectionVisible = await servicesSection.isVisible();
      console.log("Services section visible:", servicesSectionVisible);

      // Check for Add Service button
      const addServiceButton = page.locator('button:has-text("Add Service")');
      const addServiceButtonVisible = await addServiceButton.isVisible();
      console.log("Add Service button visible:", addServiceButtonVisible);

      // Check for existing services
      const serviceCards = page.locator("text=Google Ads Campaign Setup");
      const serviceCardCount = await serviceCards.count();
      console.log("Service cards found:", serviceCardCount);
    } else {
      console.log("No client cards found");
    }

    console.log("=== END CLIENTS DEBUG ===");
  });
});
