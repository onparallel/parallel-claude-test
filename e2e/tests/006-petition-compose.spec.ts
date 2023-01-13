import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { login } from "../helpers/login";
import { showCursor } from "../helpers/showCursor";
import { waitForRehydration } from "../helpers/waitForRehydration";
import { NewPetition } from "../pages/NewPetition";
import { PetitionCompose } from "../pages/PetitionCompose";

test.beforeEach(async ({ page }) => {
  await showCursor(page);
  await login(page, {
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await page.goto(`${process.env.BASE_URL}/app/petitions/new`);
  await waitForRehydration(page);
});

test.describe("Petition compose", () => {
  test.fixme("should let you create a petition with fields", async ({ page, browser, context }) => {
    await test.step("create petition", async () => {
      const newPetition = new NewPetition(page);
      await newPetition.openMyTemplates();
      await newPetition.createPetition(process.env.TEMPLATE1_ID);
      await page.waitForURL("**/app/petitions/*/preview*");
      await expect(page).toHaveTitle("Unnamed parallel - Input | Parallel");
    });

    const compose = new PetitionCompose(page);
    const name = await test.step("name petition", async () => {
      const input = compose.getPetitionNameInput();
      await expect(input).toBeFocused();
      const name = `petition compose test ${faker.random.alphaNumeric(16)}`;
      await input.fill(name);
      await input.blur();
      await expect(page).toHaveTitle(`${name} - Input | Parallel`);
      return name;
    });

    await test.step("go to compose", async () => {
      await compose.goToSection("COMPOSE");
      await expect(page).toHaveTitle(`${name} - Compose | Parallel`);
      await compose.dismissEditParallelDialog();
    });

    await test.step("fill first header field", async () => {
      await compose.fillFieldParams(0, {
        title: "Hello",
        description: "Please fill the following information",
      });
    });

    await test.step("add a SHORT_TEXT field", async () => {
      await compose.addField("SHORT_TEXT");
      await compose.fillFieldParams(1, {
        title: "Name",
        description: "Please enter your name",
      });
    });

    await test.step("add a TEXT field", async () => {
      await compose.addField("TEXT");
      await compose.fillFieldParams(2, {
        title: "Address",
        description: "Please enter your address",
      });
    });

    await test.step("add a SELECT field", async () => {
      await compose.addField("SELECT");
      await compose.fillFieldParams(3, {
        title: "Favorite fruit",
        description: "Please enter your favorite fruit",
        options: ["Apple", "Banana", "Orange", "Pineapple", "Chicken", "Grapes", "Watermelon"],
      });
    });

    await test.step("add a NUMBER field", async () => {
      await compose.addField("NUMBER");
      await compose.fillFieldParams(4, {
        title: "Favorite number",
        description: "Please enter your favorite number",
      });
    });

    await test.step("add a CHECKBOX field", async () => {
      await compose.addField("CHECKBOX");
      await compose.fillFieldParams(5, {
        title: "Consoles",
        description: "Select which consoles you own",
        options: ["Xbox Series X|S", "PlayStation 5", "Nintendo Switch"],
      });
    });

    await test.step("drag fields around", async () => {
      await compose.dragField(2, 4);
      await compose.dragField(5, 4);
      await compose.dragField(4, 3);
      expect(await compose.getFieldTitle(2)).toBe("Favorite fruit");
      expect(await compose.getFieldTitle(3)).toBe("Consoles");
      expect(await compose.getFieldTitle(4)).toBe("Favorite number");
      expect(await compose.getFieldTitle(5)).toBe("Address");
    });
  });
});
