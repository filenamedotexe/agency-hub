import { Page } from "@playwright/test";

const TEST_USERS = {
  admin: {
    email: "admin@example.com",
    password: "admin123",
  },
  client: {
    email: "johndoe@email.com",
    password: "password123",
  },
  manager: {
    email: "manager@example.com",
    password: "manager123",
  },
};

export async function setupAuth(page: Page) {
  // Clear any existing auth state
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function loginAs(
  page: Page,
  role: "admin" | "client" | "manager"
) {
  const user = TEST_USERS[role];

  console.log(`🔐 Logging in as ${role}: ${user.email}`);

  // Navigate to login page
  await page.goto("http://localhost:3001/login");

  // Fill login form
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for redirect after successful login
  if (role === "client") {
    await page.waitForURL("**/client-dashboard", { timeout: 10000 });
  } else {
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  }

  console.log(`✅ Successfully logged in as ${role}`);
}
