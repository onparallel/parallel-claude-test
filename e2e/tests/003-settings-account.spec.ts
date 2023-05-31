import { faker } from "@faker-js/faker";
import { expect, test } from "@playwright/test";
import { login } from "../helpers/login";
import { waitForGraphQL } from "../helpers/waitForGraphQL";
import { waitForRehydration } from "../helpers/waitForRehydration";
import { SettingsAccount } from "../pages/SettingsAccount";

test.beforeEach(async ({ page }) => {
  await login(page, {
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await page.goto(`${process.env.BASE_URL}/app/settings/account`);
  await waitForRehydration(page);
});

test.describe("Settings > Account", () => {
  test("should let you change the name", async ({ page }) => {
    const account = new SettingsAccount(page);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    await account.fillChangeNameForm({ firstName, lastName });
    await Promise.all([
      waitForGraphQL(page, (o) => o.operationName === "Account_updateAccount"),
      account.submitChangeNameForm(),
    ]);
    let menu = await account.openUserMenu();
    await expect(menu.getByTestId("account-name")).toHaveText(`${firstName} ${lastName}`);
    await account.closeUserMenu();
    await account.fillChangeNameForm({ firstName: "User", lastName: "1" });
    await Promise.all([
      waitForGraphQL(page, (o) => o.operationName === "Account_updateAccount"),
      account.submitChangeNameForm(),
    ]);
    menu = await account.openUserMenu();
    await expect(menu.getByTestId("account-name")).toHaveText("User 1");
    await account.closeUserMenu();
  });

  test("should not let you change the name without a last name", async ({ page }) => {
    const account = new SettingsAccount(page);
    await account.fillChangeNameForm({ firstName: faker.person.firstName(), lastName: "" });
    await account.submitChangeNameForm();
    await expect(page.getByTestId("last-name-input")).toHaveAttribute("aria-invalid", "true");
  });

  test("should let you change the language", async ({ page, context }) => {
    const account = new SettingsAccount(page);
    await account.changeLanguage("es");
    await expect(page).toHaveTitle("Cuenta | Parallel");
    await account.changeLanguage("en");
    await expect(page).toHaveTitle("Account | Parallel");
  });
});
