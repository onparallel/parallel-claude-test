import { test } from "@playwright/test";
import { login } from "../helpers/login";

test.beforeEach(async ({ page }) => {
  await login(page, {
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await page.goto(`${process.env.BASE_URL}/app/petitions/new`);
  await page.waitForLoadState();
});

test.describe("New petition", () => {
  test.fixme("should let you see public templates", async ({ page }) => {});
});
