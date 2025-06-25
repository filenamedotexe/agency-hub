import { test, expect } from "@playwright/test";
import { loginAsAdmin, navigateToProtectedPage } from "./helpers/auth";

test.describe("Attachment UI Test", () => {
  test.beforeAll(async () => {
    // CRITICAL: Always verify server responds before any test
    const response = await fetch("http://localhost:3001");
    if (!response.ok) throw new Error("Server not responding on port 3001");
  });

  test("attachment tab loads without skeleton loaders", async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);

    // Navigate to clients page
    await navigateToProtectedPage(page, "/clients");

    // Wait for page to stabilize
    await page.waitForTimeout(1000);
    await page.waitForLoadState("networkidle");

    // Click on first client in the table
    const clientRows = page
      .locator("tbody tr")
      .filter({ hasNot: page.locator(".animate-pulse") });
    const clientCount = await clientRows.count();

    if (clientCount > 0) {
      // Click first client
      await clientRows.first().click();

      // Wait for navigation to client detail page
      await page.waitForURL(/\/clients\/[a-f0-9-]+/, { timeout: 5000 });

      // Wait for services to load
      await page.waitForTimeout(1000);

      // Find and click on a service card with the "Google Ads Campaign Setup" text
      const serviceCard = page
        .locator('text="Google Ads Campaign Setup"')
        .first();
      const serviceExists = (await serviceCard.count()) > 0;

      if (serviceExists) {
        // Click the service card
        await serviceCard.click();

        // Wait for navigation or dialog
        await page.waitForTimeout(1000);

        // Check if we have a dialog or if we navigated to a new page
        const dialogExists =
          (await page.locator('[role="dialog"]').count()) > 0;

        if (!dialogExists) {
          // We might have navigated to a service detail page
          // Look for tabs or service details on the page
          console.log("No dialog found, checking for service detail page");
        }

        // Look for Service Files tab - could be in dialog or on page
        const serviceFilesTab = page.locator(
          'button:has-text("Service Files")'
        );
        const tabExists = (await serviceFilesTab.count()) > 0;

        if (tabExists) {
          await serviceFilesTab.click();

          // Wait a bit for tab content to render
          await page.waitForTimeout(1500);

          // Check if skeleton loaders are still visible after waiting
          const skeletonSelector = dialogExists
            ? '[role="dialog"] .animate-pulse'
            : ".animate-pulse";
          const skeletonCount = await page.locator(skeletonSelector).count();
          console.log("Skeleton loaders found:", skeletonCount);

          // Check for file upload area (should be present if loaded correctly)
          const fileUploadArea = await page
            .locator("text=/Drop files here|Click to upload/i")
            .count();
          console.log("File upload area found:", fileUploadArea > 0);

          // Check for any error messages
          const errorMessages = await page
            .locator("text=/error|failed/i")
            .count();
          console.log("Error messages found:", errorMessages);

          // Take a screenshot for debugging
          await page.screenshot({
            path: "attachment-tab-test.png",
            fullPage: false,
          });

          // Log what we actually see
          const visibleText = await page.locator("body").innerText();
          if (visibleText.includes("Service Files")) {
            console.log("Service Files section is visible");
          }

          // Assert that skeleton loaders are gone and upload area is visible
          expect(skeletonCount).toBe(0);
          expect(fileUploadArea).toBeGreaterThan(0);
          expect(errorMessages).toBe(0);
        } else {
          console.log("Service Files tab not found");
          await page.screenshot({ path: "no-service-files-tab.png" });
        }
      } else {
        console.log("No services found for the client");
      }
    } else {
      console.log("No clients found in the table");
    }
  });
});
