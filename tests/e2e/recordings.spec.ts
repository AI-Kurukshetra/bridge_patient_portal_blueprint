import { expect, test } from "@playwright/test";

test.use({
  viewport: { width: 1600, height: 900 },
  video: "on",
});

test.describe.configure({ mode: "serial" });

async function settle(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
}

test("record patient demo", async ({ page }) => {
  await page.goto("/demo/patient");
  await settle(page);
  await expect(page.getByRole("heading", { name: /patient experience/i })).toBeVisible();
  await page.mouse.move(300, 220);
  await page.waitForTimeout(500);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(900);
  await page.mouse.move(1180, 160);
  await page.waitForTimeout(500);
  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(1200);
});

test("record provider demo", async ({ page }) => {
  await page.goto("/demo/provider");
  await settle(page);
  await expect(page.getByRole("heading", { name: /provider experience/i })).toBeVisible();
  await page.mouse.move(350, 220);
  await page.waitForTimeout(500);
  await page.mouse.wheel(0, 420);
  await page.waitForTimeout(900);
  await page.mouse.move(820, 540);
  await page.waitForTimeout(500);
  await page.mouse.wheel(0, 620);
  await page.waitForTimeout(1200);
});

test("record admin demo", async ({ page }) => {
  await page.goto("/demo/admin");
  await settle(page);
  await expect(page.getByRole("heading", { name: /admin experience/i })).toBeVisible();
  await page.mouse.move(400, 220);
  await page.waitForTimeout(500);
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(1000);
});
