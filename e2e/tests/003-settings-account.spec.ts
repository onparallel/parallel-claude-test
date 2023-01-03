import { expect, test } from "@playwright/test";
import { login } from "../helpers/login";
import { SettingsAccount } from "../pages/SettingsAccount";

test.beforeEach(async ({ page }) => {
  await login(page, {
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await page.goto(`${process.env.BASE_URL}/app/settings/account`);
  await page.waitForLoadState();
});

test.describe("Settings > Account", () => {
  test("should let you change the name", async ({ page }) => {
    const account = new SettingsAccount(page);
    await account.fillChangeNameForm({ firstName: "Nancy", lastName: "Pelosi" });
    await account.submitChangeNameForm();
    let menu = await account.openUserMenu();
    await expect(menu.getByTestId("account-name")).toHaveText("Nancy Pelosi");
    await account.fillChangeNameForm({ firstName: "Santi", lastName: "Albo" });
    await account.submitChangeNameForm();
    menu = await account.openUserMenu();
    await expect(menu.getByTestId("account-name")).toHaveText("Santi Albo");
  });

  test("should not let you change the name without a last name", async ({ page }) => {
    const account = new SettingsAccount(page);
    await account.fillChangeNameForm({ firstName: "Nancy", lastName: "" });
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
