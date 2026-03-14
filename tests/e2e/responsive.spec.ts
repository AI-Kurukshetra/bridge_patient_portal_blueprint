import { expect, test } from "@playwright/test";

test("landing page remains usable on mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /create account/i }).first()).toBeVisible();
  const cta = page.getByRole("link", { name: /start patient onboarding/i });
  await expect(cta).toBeVisible();
  await cta.scrollIntoViewIfNeeded();
  await expect(cta).toBeInViewport();
});
