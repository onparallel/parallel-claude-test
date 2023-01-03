import { expect, test } from "@playwright/test";
import { login } from "../helpers/login";
import { AppLayout } from "../layouts/AppLayout";

test.beforeEach(async ({ page }) => {
  await login(page, {
    email: process.env.USER1_EMAIL,
    password: process.env.USER1_PASSWORD,
  });
  await page.goto(`${process.env.BASE_URL}/app/petitions`);
  await page.waitForLoadState();
});

test.describe("App layout", () => {
  test("should open the notification drawer when clicking on the notifications icon", async ({
    page,
  }) => {
    const layout = new AppLayout(page);
    const drawer = await layout.openNotificationsDrawer();
    await expect(drawer).toHaveCount(1);
    await drawer.getByTestId("notifications-drawer-close").click();
    await drawer.waitFor({ state: "detached" });
    await expect(drawer).toHaveCount(0);
  });

  test("should open the help center when clicking the help icon", async ({ page, context }) => {
    const layout = new AppLayout(page);
    const pagePromise = context.waitForEvent("page");
    await layout.openHelpCenter();
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    await expect(newPage).toHaveTitle("Parallel Help Center");
  });

  test("should show the email inside the user menu", async ({ page }) => {
    const layout = new AppLayout(page);
    const menu = await layout.openUserMenu();
    const email = await menu.getByTestId("account-email");
    await expect(email).toHaveText(process.env.USER1_EMAIL);
  });

  test("should navigate on the different links in the user menu", async ({ page }) => {
    const layout = new AppLayout(page);
    let menu = await layout.openUserMenu();
    await menu.getByText("Settings").click();
    await page.waitForURL("**/app/settings/account");
    await expect(page).toHaveTitle("Account | Parallel");

    menu = await layout.openUserMenu();
    await menu.getByText("Organization").click();
    await page.waitForURL("**/app/organization/users");
    await expect(page).toHaveTitle("Users | Parallel");

    menu = await layout.openUserMenu();
    await menu.getByText("Admin panel").click();
    await page.waitForURL("**/app/admin/organizations");
    await expect(page).toHaveTitle("Organizations | Parallel");
  });
});
