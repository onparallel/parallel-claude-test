import { test, expect } from "@playwright/test";
import { login } from "../helpers/login";
import { NewPetition } from "../pages/NewPetition";
import { PetitionCompose } from "../pages/PetitionCompose";

test.beforeEach(async ({ page }) => {
  await login(page, {
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await page.goto(`${process.env.BASE_URL}/app/petitions/new`);
  await page.waitForLoadState();
});

test.describe.only("Petition compose", () => {
  test("should let you create a petition", async ({ page }) => {
    await test.step("create petition", async () => {
      const newPetition = new NewPetition(page);
      await newPetition.createPetition(process.env.TEMPLATE1_ID);
      await page.waitForURL("**/app/petitions/*/preview*");
      await expect(page).toHaveTitle("Unnamed parallel - Input | Parallel");
    });

    const compose = new PetitionCompose(page);
    await test.step("name petition", async () => {
      const name = await compose.getPetitionNameInput();
      await expect(name).toBeFocused();
      await name.fill("El libro de la selva");
      await name.blur();
      await expect(page).toHaveTitle("El libro de la selva - Input | Parallel");
    });

    await compose.goToSection("COMPOSE");
    await expect(page).toHaveTitle("El libro de la selva - Compose | Parallel");
  });
});
