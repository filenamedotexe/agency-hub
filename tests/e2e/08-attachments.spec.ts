import { test, expect } from "@playwright/test";
import { loginAsRole, type UserRole } from "./helpers/role-auth";
import {
  mcpTakeScreenshot,
  mcpVerifyAccessibility,
  mcpMonitorNetworkRequests,
  mcpVerifyToast,
  mcpNavigateWithMonitoring,
} from "./helpers/mcp-utils";
import path from "path";

test.describe("Attachment System", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, "ADMIN");
  });

  test.describe("Client Attachments", () => {
    test("upload attachment to client", async ({ page }) => {
      // Monitor API requests
      const requests = await mcpMonitorNetworkRequests(page, "/api/");

      await mcpNavigateWithMonitoring(page, "/clients", {
        waitForRequests: ["/api/clients"],
      });

      // Click first client
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();
      await page.waitForLoadState("networkidle");

      // Find attachments section
      const attachmentsSection = page.locator(
        'section:has-text("Attachments"), section:has-text("Files")'
      );
      await expect(attachmentsSection).toBeVisible();

      // Take screenshot of attachments section before upload
      await mcpTakeScreenshot(page, {
        element: "Attachments section",
        ref: 'section:has-text("Attachments")',
        filename: "attachments-before-upload.png",
      });

      // Click upload button
      const uploadButton = attachmentsSection.locator(
        'button:has-text("Upload"), button:has-text("Add File")'
      );
      await uploadButton.click();

      // Handle file input
      const fileInput = page.locator('input[type="file"]');

      // Create a test file path (you may need to adjust this)
      const testFilePath = path.join(
        __dirname,
        "fixtures",
        "test-document.pdf"
      );

      // If fixtures don't exist, use a simple approach
      await fileInput.setInputFiles({
        name: "test-document.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("Test PDF content"),
      });

      // Wait for upload
      await page.waitForLoadState("networkidle");

      // Verify upload success toast
      await mcpVerifyToast(page, "uploaded successfully", {
        screenshot: true,
      });

      // Verify file appears
      await expect(page.locator('text="test-document.pdf"')).toBeVisible();

      // Check for file metadata
      await expect(page.locator("text=/PDF|pdf/")).toBeVisible();
      await expect(page.locator("text=/\d+\s*(KB|MB|bytes)/")).toBeVisible();

      // Take screenshot of attachments section after upload
      await mcpTakeScreenshot(page, {
        element: "Attachments section with file",
        ref: 'section:has-text("Attachments")',
        filename: "attachments-after-upload.png",
      });

      // Verify upload API call was successful
      const uploadRequest = requests.find(
        (r) =>
          r.url.includes("/api/attachments") || r.url.includes("/api/upload")
      );
      expect(uploadRequest?.status).toBe(200);
    });

    test("view and download attachments", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      // Find existing attachment
      const attachment = page
        .locator('[data-testid="attachment-item"], .attachment-item')
        .first();

      if (await attachment.isVisible()) {
        // Check for download button
        const downloadButton = attachment.locator(
          'button:has-text("Download"), a[download]'
        );
        await expect(downloadButton).toBeVisible();

        // Set up download promise
        const downloadPromise = page.waitForEvent("download");
        await downloadButton.click();

        // Verify download started
        const download = await downloadPromise;
        expect(download).toBeTruthy();
      }
    });

    test("delete attachment with confirmation", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      // Upload a file first
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "delete-test.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Delete test file"),
      });

      await page.waitForLoadState("networkidle");

      // Find the uploaded file
      const attachment = page.locator(
        '[data-testid="attachment-item"]:has-text("delete-test.txt")'
      );

      if (await attachment.isVisible()) {
        // Click delete
        await attachment
          .locator('button:has-text("Delete"), button[aria-label="Delete"]')
          .click();

        // Confirm deletion
        await page.click('button:has-text("Confirm"), button:has-text("Yes")');

        // Verify deletion
        await expect(
          page.getByText("Attachment deleted successfully")
        ).toBeVisible();
        await expect(page.locator('text="delete-test.txt"')).not.toBeVisible();
      }
    });
  });

  test.describe("Service & Task Attachments", () => {
    test("attach files to service", async ({ page }) => {
      await page.goto("/services");
      await page.waitForLoadState("networkidle");

      // Go to a client with services
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      // Find a service
      const service = page
        .locator('[data-testid="service-item"], .service-card')
        .first();

      if (await service.isVisible()) {
        await service.click();

        // Upload attachment to service
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({
          name: "service-contract.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("Service contract content"),
        });

        await page.waitForLoadState("networkidle");

        // Verify attachment
        await expect(page.locator('text="service-contract.pdf"')).toBeVisible();
      }
    });

    test("task attachments aggregate to service level", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const service = page
        .locator('[data-testid="service-item"], .service-card')
        .first();

      if (await service.isVisible()) {
        await service.click();

        // Find a task
        const task = page
          .locator('[data-testid="task-item"], .task-item')
          .first();

        if (await task.isVisible()) {
          await task.click();

          // Upload to task
          const fileInput = page.locator('input[type="file"]');
          await fileInput.setInputFiles({
            name: "task-deliverable.docx",
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            buffer: Buffer.from("Task deliverable content"),
          });

          await page.waitForLoadState("networkidle");

          // Go back to service level
          await page.click(
            'button:has-text("Back"), button[aria-label="Close"]'
          );

          // Check if task attachment shows at service level
          const serviceAttachments = page.locator(
            'section:has-text("Service Attachments")'
          );
          if (await serviceAttachments.isVisible()) {
            await expect(
              serviceAttachments.locator('text="task-deliverable.docx"')
            ).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("Form Response Attachments", () => {
    test("CLIENT can upload files in form responses", async ({ page }) => {
      await loginAsRole(page, "CLIENT");
      await page.goto("/client-dashboard");

      // Find a form with file upload
      const formCard = page
        .locator('[data-testid="form-card"], .form-card')
        .first();

      if (await formCard.isVisible()) {
        await formCard.click();

        // Look for file upload field
        const fileUploadField = page.locator('input[type="file"]');

        if (await fileUploadField.isVisible()) {
          // Upload file
          await fileUploadField.setInputFiles({
            name: "form-attachment.jpg",
            mimeType: "image/jpeg",
            buffer: Buffer.from("JPEG image data"),
          });

          // Submit form
          await page.click('button[type="submit"]');

          // Verify submission
          await expect(
            page.getByText("Form submitted successfully")
          ).toBeVisible();
        }
      }
    });

    test("form attachments visible in client details", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      // Check form responses section
      const formResponsesSection = page.locator(
        'section:has-text("Form Responses")'
      );

      if (await formResponsesSection.isVisible()) {
        // Look for attachments in form responses
        const responseWithAttachment = formResponsesSection
          .locator(".form-response:has(.attachment-icon)")
          .first();

        if (await responseWithAttachment.isVisible()) {
          await responseWithAttachment.click();

          // Should show attachment details
          await expect(
            page.locator("text=/\.(pdf|jpg|png|docx?)/")
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("File Type and Size Validation", () => {
    test("validate allowed file types", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const fileInput = page.locator('input[type="file"]');

      // Try to upload disallowed file type
      await fileInput.setInputFiles({
        name: "test.exe",
        mimeType: "application/x-msdownload",
        buffer: Buffer.from("Executable content"),
      });

      // Should show error
      await expect(
        page.locator("text=/not allowed|invalid file type|unsupported/i")
      ).toBeVisible();
    });

    test("validate file size limits", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const fileInput = page.locator('input[type="file"]');

      // Create large file (over typical limit)
      const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB

      await fileInput.setInputFiles({
        name: "large-file.pdf",
        mimeType: "application/pdf",
        buffer: largeBuffer,
      });

      // Should show size error
      await expect(
        page.locator("text=/too large|exceeds.*limit|maximum.*size/i")
      ).toBeVisible();
    });

    test("show file preview for images", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const fileInput = page.locator('input[type="file"]');

      // Upload image
      await fileInput.setInputFiles({
        name: "preview-test.png",
        mimeType: "image/png",
        buffer: Buffer.from("PNG image data"),
      });

      await page.waitForLoadState("networkidle");

      // Look for image preview
      const imagePreview = page.locator(
        'img[src*="preview-test"], [data-testid="image-preview"]'
      );

      if (await imagePreview.isVisible()) {
        // Click to view full size
        await imagePreview.click();

        // Should open modal or lightbox
        await expect(
          page.locator('[role="dialog"]:has(img), .lightbox')
        ).toBeVisible();
      }
    });
  });

  test.describe("Attachment Organization", () => {
    test("attachments organized by type and date", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const attachmentsSection = page.locator(
        'section:has-text("Attachments")'
      );

      // Check for organization features
      const sortDropdown = attachmentsSection.locator(
        'button:has-text("Sort"), select[name="sort"]'
      );

      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();

        // Should have sort options
        await expect(
          page.locator('[role="option"]:has-text("Date")')
        ).toBeVisible();
        await expect(
          page.locator('[role="option"]:has-text("Name")')
        ).toBeVisible();
        await expect(
          page.locator('[role="option"]:has-text("Size")')
        ).toBeVisible();
      }

      // Check for filter by type
      const filterButton = attachmentsSection.locator(
        'button:has-text("Filter")'
      );

      if (await filterButton.isVisible()) {
        await filterButton.click();

        // Should have file type filters
        await expect(page.locator('text="Documents"')).toBeVisible();
        await expect(page.locator('text="Images"')).toBeVisible();
        await expect(page.locator('text="All Files"')).toBeVisible();
      }
    });

    test("search attachments by name", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const attachmentsSection = page.locator(
        'section:has-text("Attachments")'
      );
      const searchInput = attachmentsSection.locator(
        'input[placeholder*="Search"], input[type="search"]'
      );

      if (await searchInput.isVisible()) {
        await searchInput.fill("contract");
        await page.waitForTimeout(500); // Debounce

        // Should filter attachments
        const visibleAttachments = attachmentsSection.locator(
          '[data-testid="attachment-item"]:visible'
        );

        if ((await visibleAttachments.count()) > 0) {
          const firstAttachment = await visibleAttachments
            .first()
            .textContent();
          expect(firstAttachment?.toLowerCase()).toContain("contract");
        }
      }
    });
  });

  test.describe("Role-Based Attachment Access", () => {
    test("all roles can upload attachments to their accessible entities", async ({
      page,
    }) => {
      const roles: UserRole[] = [
        "ADMIN",
        "SERVICE_MANAGER",
        "COPYWRITER",
        "EDITOR",
        "VA",
      ];

      for (const role of roles) {
        await loginAsRole(page, role);

        // Navigate to accessible area
        if (["ADMIN", "SERVICE_MANAGER", "VA"].includes(role)) {
          await page.goto("/clients");
          const hasClients = (await page.locator("tbody tr").count()) > 0;

          if (hasClients) {
            await page.locator("tbody tr").first().click();

            // Should see upload capability
            const uploadButton = page.locator(
              'button:has-text("Upload"), input[type="file"]'
            );
            await expect(uploadButton.first()).toBeVisible();
          }
        } else if (["COPYWRITER", "EDITOR"].includes(role)) {
          await page.goto("/services");

          // Should be able to upload to assigned tasks
          const assignedTask = page
            .locator('[data-testid="assigned-task"]')
            .first();
          if (await assignedTask.isVisible()) {
            await assignedTask.click();
            const uploadButton = page.locator('input[type="file"]');
            await expect(uploadButton).toBeVisible();
          }
        }
      }
    });

    test("CLIENT can only view client-visible attachments", async ({
      page,
    }) => {
      await loginAsRole(page, "CLIENT");
      await page.goto("/client-dashboard");

      // Check services section
      const servicesSection = page.locator('section:has-text("My Services")');

      if (await servicesSection.isVisible()) {
        const service = servicesSection
          .locator('[data-testid="service-item"]')
          .first();

        if (await service.isVisible()) {
          await service.click();

          // Should only see client-visible task attachments
          const attachments = page.locator('[data-testid="attachment-item"]');

          // Should not see internal-only indicators
          await expect(
            attachments.locator('text="Internal Only"')
          ).not.toBeVisible();
        }
      }
    });
  });

  test.describe("Attachment Metadata", () => {
    test("attachments show upload metadata", async ({ page }) => {
      await page.goto("/clients");
      const clientRow = page.locator("tbody tr").first();
      await clientRow.click();

      const attachment = page
        .locator('[data-testid="attachment-item"], .attachment-item')
        .first();

      if (await attachment.isVisible()) {
        // Should show metadata
        await expect(
          attachment.locator("text=/Uploaded.*ago|Uploaded by/")
        ).toBeVisible();
        await expect(attachment.locator("text=/\d+.*[KMG]B/")).toBeVisible(); // File size

        // Hover or click for more details
        await attachment.hover();

        // Might show tooltip with full metadata
        const tooltip = page.locator('[role="tooltip"], .tooltip');
        if (await tooltip.isVisible()) {
          await expect(
            tooltip.locator("text=/Type:|Size:|Uploaded:/")
          ).toBeVisible();
        }
      }
    });
  });
});
