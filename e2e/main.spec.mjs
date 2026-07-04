import { test, expect } from "@playwright/test";
import { loginAs, signOut, TEST_USERS } from "./helpers.mjs";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await signOut(page);
  });

  test("login page loads and shows form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type=email]")).toBeVisible();
    await expect(page.locator("input[type=password]")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await loginAs(page, "user");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type=email]", "wrong@test.com");
    await page.fill("input[type=password]", "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid")).toBeVisible();
  });

  test("signup page has required fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input[type=email]")).toBeVisible();
    await expect(page.locator("input[type=password]")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Rewrite Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "user");
  });

  test("dashboard shows rewrite form", async ({ page }) => {
    await expect(page.locator("text=Your Message")).toBeVisible();
    await expect(page.locator("text=Rewrite Safely")).toBeVisible();
    await expect(page.locator("#input-draft")).toBeVisible();
  });

  test("submit empty draft does not trigger rewrite", async ({ page }) => {
    const button = page.locator("#btn-rewrite-submit");
    await expect(button).toBeDisabled();
  });

  test("submitting draft shows generated message", async ({ page }) => {
    await page.fill("#input-draft", "This is a test message for the rewrite feature.");
    await page.click("#btn-rewrite-submit");
    await expect(page.locator("text=Rewritten Version").or(page.locator("text=Improvements Made"))).toBeVisible({ timeout: 15000 });
  });

  test("tone selector changes visual state", async ({ page }) => {
    await page.click("text=Diplomatic");
    const selected = page.locator('[class*="bg-brand"]').first();
    await expect(selected).toBeVisible();
  });
});

test.describe("Pricing", () => {
  test("pricing page shows plans", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("text=Choose Your Plan")).toBeVisible();
    await expect(page.locator("text=Monthly").or(page.locator("text=Annual"))).toBeVisible();
  });

  test("dev mode bypass is visible", async ({ page }) => {
    await page.goto("/pricing");
    if (await page.locator("text=Development Mode").isVisible()) {
      await expect(page.locator("text=Bypass Pricing")).toBeVisible();
    }
  });
});

test.describe("Admin Panel", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("admin dashboard shows stats", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Total Users").or(page.locator("text=Total Admins"))).toBeVisible();
  });

  test("admin users page loads", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator("text=Users").or(page.locator("text=Email"))).toBeVisible();
  });
});