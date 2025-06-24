import { test, expect, devices } from "@playwright/test";
import { loginAsRole, navigateWithRole } from "./helpers/role-auth";

// Test on different mobile devices
const mobileDevices = [
  { name: "iPhone SE", device: devices["iPhone SE"] },
  { name: "iPhone 12", device: devices["iPhone 12"] },
  { name: "Pixel 5", device: devices["Pixel 5"] },
  { name: "iPad", device: devices["iPad"] },
];

test.describe("Forms - Mobile Experience", () => {
  for (const { name, device } of mobileDevices) {
    test.describe(`${name}`, () => {
      test.use({ ...device });

      test("mobile navigation and form list works", async ({ page }) => {
        await loginAsRole(page, "ADMIN");

        // Navigate to dashboard
        await page.goto("/dashboard");
        await page.waitForLoadState("domcontentloaded");

        // On mobile, might need to open menu
        const menuButton = page.locator(
          '[data-testid="mobile-menu-button"], button:has-text("Menu")'
        );
        if (await menuButton.isVisible()) {
          await menuButton.tap();
          await page.waitForTimeout(500);
        }

        // Navigate to forms
        await page.locator("text=Forms").first().tap();
        await page.waitForURL("**/forms");
        await page.waitForLoadState("domcontentloaded");

        // Verify mobile layout
        await expect(page.locator("h1:has-text('Forms')")).toBeVisible();

        // Create button should be visible
        const createButton = page.locator("button:has-text('Create Form')");
        await expect(createButton).toBeVisible();

        // Check if table is responsive
        const table = page.locator("table");
        if (await table.isVisible()) {
          // Table should be scrollable on mobile
          const isScrollable = await table.evaluate((el) => {
            return el.scrollWidth > el.clientWidth;
          });

          // On narrow devices, table might be scrollable
          if (device.viewport.width < 640) {
            expect(isScrollable).toBeTruthy();
          }
        }
      });

      test("mobile form builder interface", async ({ page }) => {
        await loginAsRole(page, "ADMIN");
        await navigateWithRole(page, "/forms/new", true);

        // Form name input should be accessible
        const nameInput = page.locator('input[id="name"]');
        await expect(nameInput).toBeVisible();
        await nameInput.tap();
        await page.keyboard.type("Mobile Test Form");

        // Field type selector should be visible and scrollable
        const fieldTypeSelector = page.locator(
          '[data-testid="field-type-selector"]'
        );
        await expect(fieldTypeSelector).toBeVisible();

        // On mobile, field buttons might be in a scrollable container
        const fieldButtons = page.locator(
          '[data-testid="field-type-selector"] button'
        );
        const buttonCount = await fieldButtons.count();
        expect(buttonCount).toBeGreaterThan(5);

        // Test horizontal scroll if needed
        if (device.viewport.width < 640) {
          const container = fieldTypeSelector;
          const isScrollable = await container.evaluate((el) => {
            return el.scrollWidth > el.clientWidth;
          });

          if (isScrollable) {
            // Scroll to see more buttons
            await container.evaluate((el) => {
              el.scrollLeft = el.scrollWidth;
            });
          }
        }

        // Add a field via tap
        await page.locator("button:has-text('Text')").tap();
        await page.waitForTimeout(500);

        // Verify field was added
        const fields = page.locator('[data-testid="sortable-field"]');
        await expect(fields).toHaveCount(1);
      });

      test("mobile field configuration", async ({ page }) => {
        await loginAsRole(page, "ADMIN");
        await navigateWithRole(page, "/forms/new", true);

        // Add fields
        await page.fill('input[id="name"]', "Mobile Config Test");
        await page.locator("button:has-text('Text')").tap();
        await page.waitForTimeout(500);

        const field = page.locator('[data-testid="sortable-field"]').first();

        // Tap to focus on field label
        const labelInput = field.locator('input[placeholder="Field label"]');
        await labelInput.tap();
        await page.keyboard.type("Mobile Field");

        // Check if field options are accessible
        const checkbox = field.locator('input[type="checkbox"]');
        await checkbox.tap();

        // Verify checkbox is checked
        await expect(checkbox).toBeChecked();

        // Test field removal on mobile
        const removeButton = field.locator("button[title='Remove field']");
        await removeButton.tap();
        await page.waitForTimeout(500);

        // Field should be removed
        await expect(
          page.locator('[data-testid="sortable-field"]')
        ).toHaveCount(0);
      });

      test("mobile form preview", async ({ page }) => {
        await loginAsRole(page, "ADMIN");

        // Navigate to forms
        await navigateWithRole(page, "/forms", true);
        await page.waitForLoadState("networkidle");

        // Find preview button
        const previewButtons = page.locator("button[title='Preview Form']");
        if ((await previewButtons.count()) > 0) {
          await previewButtons.first().tap();
          await page.waitForURL("**/preview");

          // Verify preview mode
          await expect(page.locator("text=Preview Mode")).toBeVisible();

          // Check viewport switcher on mobile
          const viewportButtons = page.locator(
            '[data-testid="viewport-switcher"] button'
          );
          if ((await viewportButtons.count()) > 0) {
            // Should be able to switch viewports even on mobile
            await page.locator("button:has-text('Desktop')").tap();
            await page.waitForTimeout(500);
          }

          // Form should be scrollable if needed
          const form = page.locator("form");
          const isScrollable = await form.evaluate((el) => {
            return el.scrollHeight > el.clientHeight;
          });

          // Fill form if visible
          const submitButton = page.locator("button[type='submit']");
          if (await submitButton.isVisible()) {
            // Fill required fields
            const inputs = page.locator("input[required]");
            const inputCount = await inputs.count();

            for (let i = 0; i < inputCount; i++) {
              await inputs.nth(i).tap();
              await page.keyboard.type("Mobile Test");
            }

            await submitButton.tap();
          }
        }
      });

      test("touch gestures for form builder", async ({ page }) => {
        await loginAsRole(page, "ADMIN");
        await navigateWithRole(page, "/forms/new", true);

        await page.fill('input[id="name"]', "Touch Gesture Test");

        // Add multiple fields
        await page.locator("button:has-text('Text')").tap();
        await page.waitForTimeout(300);
        await page.locator("button:has-text('Email')").tap();
        await page.waitForTimeout(300);
        await page.locator("button:has-text('Number')").tap();
        await page.waitForTimeout(300);

        // Test touch and hold for drag handle
        const fields = page.locator('[data-testid="sortable-field"]');
        const firstField = fields.nth(0);
        const dragHandle = firstField.locator('[data-testid="drag-handle"]');

        // Touch interactions
        if (await dragHandle.isVisible()) {
          // Long press simulation
          await dragHandle.tap({ delay: 500 });

          // Note: Actual drag gestures might not work perfectly in Playwright
          // but we can verify the UI responds to touch events
        }

        // Test swipe to delete (if implemented)
        const deleteButton = firstField.locator("button[title='Remove field']");
        await expect(deleteButton).toBeVisible();
      });

      test("responsive form submission on mobile", async ({ page }) => {
        await loginAsRole(page, "CLIENT");

        // Navigate to client forms
        await page.goto("/dashboard");
        const formsMenuItem = page.locator("nav >> text='Forms'").first();

        if (await formsMenuItem.isVisible()) {
          await formsMenuItem.tap();
          await page.waitForLoadState("domcontentloaded");

          // Look for available forms
          const formItems = page.locator(
            '[data-testid="form-item"], .form-card, a[href*="/forms/"]'
          );
          if ((await formItems.count()) > 0) {
            await formItems.first().tap();
            await page.waitForLoadState("domcontentloaded");

            // Check if form is displayed properly on mobile
            const form = page.locator("form");
            if (await form.isVisible()) {
              // Verify form is not cut off
              const viewport = page.viewportSize();
              const formBox = await form.boundingBox();

              if (formBox && viewport) {
                expect(formBox.width).toBeLessThanOrEqual(viewport.width);
              }

              // Test keyboard behavior
              const firstInput = page.locator("input").first();
              if (await firstInput.isVisible()) {
                await firstInput.tap();

                // Virtual keyboard should appear (simulated in tests)
                // In real mobile, this would shift the viewport
                await page.keyboard.type("Mobile input test");
              }
            }
          }
        }
      });

      test("mobile-specific UI elements", async ({ page }) => {
        await loginAsRole(page, "ADMIN");
        await navigateWithRole(page, "/forms/new", true);

        // Check for mobile-optimized elements
        const mobileOnlyElements = [
          '[data-testid="mobile-field-menu"]',
          '[data-testid="mobile-actions"]',
          ".mobile-only",
        ];

        for (const selector of mobileOnlyElements) {
          const element = page.locator(selector);
          if ((await element.count()) > 0) {
            // Mobile-specific elements should be visible on mobile
            if (device.viewport.width < 768) {
              await expect(element.first()).toBeVisible();
            }
          }
        }

        // Check touch target sizes
        const buttons = page.locator("button");
        const buttonCount = await buttons.count();

        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const box = await button.boundingBox();
            if (box) {
              // Touch targets should be at least 44x44px
              expect(box.width).toBeGreaterThanOrEqual(44);
              expect(box.height).toBeGreaterThanOrEqual(44);
            }
          }
        }
      });

      test("offline form handling", async ({ page, context }) => {
        await loginAsRole(page, "ADMIN");
        await navigateWithRole(page, "/forms/new", true);

        // Add form data
        await page.fill('input[id="name"]', "Offline Test Form");
        await page.locator("button:has-text('Text')").tap();

        // Simulate offline
        await context.setOffline(true);

        // Try to save
        await page.locator("button:has-text('Create Form')").tap();

        // Should show offline indicator or handle gracefully
        await page.waitForTimeout(2000);

        // Check for offline message or saved state
        const offlineIndicators = [
          "text=offline",
          "text=connection",
          "text=retry",
          "[data-testid='offline-indicator']",
        ];

        let foundOfflineHandling = false;
        for (const indicator of offlineIndicators) {
          if (
            await page
              .locator(indicator)
              .isVisible({ timeout: 1000 })
              .catch(() => false)
          ) {
            foundOfflineHandling = true;
            break;
          }
        }

        // Restore connection
        await context.setOffline(false);
      });
    });
  }
});
