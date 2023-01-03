import { expect, test } from "@playwright/test";
import { login } from "../helpers/login";
import { PetitionsList } from "../pages/PetitionsList";

test.beforeEach(async ({ page }) => {
  await login(page, {
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await page.goto(`${process.env.BASE_URL}/app/petitions`);
  await page.waitForLoadState();
});

test.describe("Petitions list", () => {
  test("should let me change between parallels and templates", async ({ page }) => {
    await expect(page).toHaveTitle("Parallels | Parallel");
    const petitionsList = new PetitionsList(page);
    await petitionsList.changePetitionType("TEMPLATE");
    await expect(page).toHaveTitle("Templates | Parallel");
  });
});
