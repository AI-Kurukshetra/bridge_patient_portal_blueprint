import { expect, test } from "@playwright/test";

test("forgot password page renders recovery form", async ({ page }) => {
  await page.goto("/forgot-password");

  await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
});

test("reset password page renders update form", async ({ page }) => {
  await page.goto("/reset-password");

  await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /update password/i })).toBeVisible();
});
