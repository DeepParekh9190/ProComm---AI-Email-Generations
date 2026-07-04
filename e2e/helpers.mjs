import { expect } from "@playwright/test";

export const TEST_USERS = {
  admin: { email: "admin@procomm.ai", password: "Admin@123456!" },
  user: { email: "testuser@test.com", password: "Test@123456" },
};

export async function loginAs(page, role = "user") {
  const user = TEST_USERS[role] || TEST_USERS.user;
  await page.goto("/login");
  await page.fill("input[type=email]", user.email);
  await page.fill("input[type=password]", user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/$/);
}

export async function signOut(page) {
  await page.goto("/");
  const avatar = page.locator('[class*="rounded-full"]').first();
  if (await avatar.isVisible()) {
    await avatar.click();
    await page.click('text=Sign out');
    await page.waitForURL("/login");
  }
}