import { test, expect } from "@playwright/test";

for (const viewport of [
  { width: 320, height: 740, label: "compact mobile" },
  { width: 360, height: 800, label: "small mobile" },
  { width: 390, height: 844, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1280, height: 900, label: "desktop" },
]) {
  test(`landing page has no horizontal overflow at ${viewport.label}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
  });
}

test("custom CampusLoop mark and responsive signup navigation render", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/icon.svg");
  await expect(page.getByRole("heading", { name: /your campus is full of possibility/i })).toBeVisible();
  await page.getByRole("link", { name: /join campusloop/i }).click();
  await expect(page.getByRole("heading", { name: /join your campus/i })).toBeVisible();
});

for (const width of [320, 360, 390, 768, 1280]) {
  test(`signup page stays within ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 820 });
    await page.goto("/signup");
    const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
    await expect(page.getByLabel("College email")).toBeVisible();
  });
}
