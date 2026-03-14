import { expect, test } from "@playwright/test";

test("landing page renders primary CTA", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /a modern patient portal with real supabase data/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /start patient onboarding/i }),
  ).toBeVisible();
});

test("login page renders sign-in form", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: /sign in/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/email address/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByText(/provider panel/i)).toBeVisible();
});

test("register page renders account creation form", async ({ page }) => {
  await page.goto("/register");

  await expect(
    page.getByRole("heading", { name: /create account/i }),
  ).toBeVisible();
  await expect(page.getByLabel(/full name/i)).toBeVisible();
  await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  await expect(page.getByText(/account role/i)).toBeVisible();
  await expect(page.getByText(/provider/i).first()).toBeVisible();
});