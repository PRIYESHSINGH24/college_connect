import { test, expect } from "@playwright/test";
test("landing page renders the CampusLoop value proposition", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /your campus/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /join campusloop/i })).toBeVisible();
});
test("signup form is reachable", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /join your campus/i })).toBeVisible();
  await expect(page.getByLabel("College email")).toBeVisible();
});
