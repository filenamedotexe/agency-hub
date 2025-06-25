import { Page } from "@playwright/test";

/**
 * MCP-enhanced utilities for E2E testing
 * These utilities leverage Playwright MCP tools for enhanced testing capabilities
 */

export interface MCPScreenshotOptions {
  element?: string;
  ref?: string;
  filename?: string;
  raw?: boolean;
}

export interface MCPNetworkRequest {
  url: string;
  method: string;
  status?: number;
  response?: any;
}

/**
 * Take a screenshot using MCP tools
 * Useful for visual regression testing
 */
export async function mcpTakeScreenshot(
  page: Page,
  options: MCPScreenshotOptions = {}
): Promise<void> {
  // This would integrate with mcp__playwright__browser_take_screenshot
  // For now, using standard Playwright as a fallback
  const screenshotOptions: any = {};

  if (options.filename) {
    screenshotOptions.path = `tests/e2e/screenshots/${options.filename}`;
  }

  if (options.element && options.ref) {
    const element = await page.locator(options.ref);
    await element.screenshot(screenshotOptions);
  } else {
    await page.screenshot(screenshotOptions);
  }
}

/**
 * Capture accessibility snapshot using MCP tools
 * Useful for ensuring proper ARIA labels and accessibility
 */
export async function mcpAccessibilitySnapshot(page: Page): Promise<any> {
  // This would integrate with mcp__playwright__browser_snapshot
  // For now, using standard Playwright accessibility tree
  return await page.accessibility.snapshot();
}

/**
 * Monitor network requests using MCP tools
 * Useful for verifying API calls and webhooks
 */
export async function mcpMonitorNetworkRequests(
  page: Page,
  urlPattern?: string
): Promise<MCPNetworkRequest[]> {
  // This would integrate with mcp__playwright__browser_network_requests
  // For now, using standard Playwright network monitoring
  const requests: MCPNetworkRequest[] = [];

  page.on("request", (request) => {
    if (!urlPattern || request.url().includes(urlPattern)) {
      requests.push({
        url: request.url(),
        method: request.method(),
      });
    }
  });

  page.on("response", (response) => {
    const index = requests.findIndex((r) => r.url === response.url());
    if (index !== -1) {
      requests[index].status = response.status();
    }
  });

  return requests;
}

/**
 * Enhanced wait for element with MCP integration
 * Provides better debugging with automatic screenshots on failure
 */
export async function mcpWaitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; screenshot?: boolean } = {}
): Promise<void> {
  try {
    await page.waitForSelector(selector, { timeout: options.timeout || 30000 });
  } catch (error) {
    if (options.screenshot !== false) {
      await mcpTakeScreenshot(page, {
        filename: `error-${Date.now()}.png`,
      });
    }
    throw error;
  }
}

/**
 * Enhanced form filling with validation
 */
export async function mcpFillForm(
  page: Page,
  formData: Record<string, string>,
  options: { screenshot?: boolean } = {}
): Promise<void> {
  for (const [selector, value] of Object.entries(formData)) {
    await mcpWaitForElement(page, selector);
    await page.fill(selector, value);
  }

  if (options.screenshot) {
    await mcpTakeScreenshot(page, {
      filename: `form-filled-${Date.now()}.png`,
    });
  }
}

/**
 * Verify page accessibility
 */
export async function mcpVerifyAccessibility(
  page: Page,
  options: {
    includeRoles?: string[];
    excludeRoles?: string[];
    checkLabels?: boolean;
  } = {}
): Promise<boolean> {
  const snapshot = await mcpAccessibilitySnapshot(page);

  if (!snapshot) return false;

  // Basic accessibility checks
  const violations: string[] = [];

  function checkNode(node: any): void {
    if (!node) return;

    // Check for missing labels on interactive elements
    if (options.checkLabels !== false) {
      const interactiveRoles = [
        "button",
        "link",
        "textbox",
        "combobox",
        "checkbox",
      ];
      if (interactiveRoles.includes(node.role) && !node.name) {
        violations.push(`Missing label for ${node.role}`);
      }
    }

    // Check included/excluded roles
    if (options.includeRoles && !options.includeRoles.includes(node.role)) {
      return;
    }
    if (options.excludeRoles && options.excludeRoles.includes(node.role)) {
      return;
    }

    // Recurse through children
    if (node.children) {
      node.children.forEach(checkNode);
    }
  }

  checkNode(snapshot);

  if (violations.length > 0) {
    console.error("Accessibility violations:", violations);
    return false;
  }

  return true;
}

/**
 * Generate a Playwright test using MCP
 */
export async function mcpGenerateTest(
  name: string,
  description: string,
  steps: string[]
): Promise<string> {
  // This would integrate with mcp__playwright__browser_generate_playwright_test
  // For now, returning a template
  return `
import { test, expect } from '@playwright/test';
import { loginAsRole } from './helpers/role-auth';

test('${name}', async ({ page }) => {
  // ${description}
  
  ${steps.map((step) => `// ${step}`).join("\n  ")}
});
`;
}

/**
 * Enhanced navigation with network monitoring
 */
export async function mcpNavigateWithMonitoring(
  page: Page,
  url: string,
  options: {
    waitForRequests?: string[];
    screenshot?: boolean;
  } = {}
): Promise<MCPNetworkRequest[]> {
  const requests = await mcpMonitorNetworkRequests(page);

  await page.goto(url);
  await page.waitForLoadState("networkidle");

  if (options.waitForRequests) {
    for (const pattern of options.waitForRequests) {
      await page.waitForResponse(
        (response) =>
          response.url().includes(pattern) && response.status() === 200
      );
    }
  }

  if (options.screenshot) {
    await mcpTakeScreenshot(page, {
      filename: `navigation-${Date.now()}.png`,
    });
  }

  return requests;
}

/**
 * Verify toast notifications with screenshot
 */
export async function mcpVerifyToast(
  page: Page,
  expectedText: string,
  options: { screenshot?: boolean; timeout?: number } = {}
): Promise<void> {
  const toastSelector = '[data-sonner-toast], .toast, [role="status"]';

  await page.waitForSelector(toastSelector, {
    timeout: options.timeout || 5000,
  });

  const toastText = await page.textContent(toastSelector);

  if (options.screenshot) {
    await mcpTakeScreenshot(page, {
      element: "Toast notification",
      ref: toastSelector,
      filename: `toast-${Date.now()}.png`,
    });
  }

  if (!toastText?.includes(expectedText)) {
    throw new Error(`Expected toast "${expectedText}" but got "${toastText}"`);
  }
}
