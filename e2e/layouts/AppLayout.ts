import { Page } from "@playwright/test";
import { closeMenu } from "../helpers/chakra/closeMenu";
import { openMenu } from "../helpers/chakra/openMenu";

export class AppLayout {
  constructor(protected page: Page) {}

  async dismissUserflow() {
    await this.page.locator("#userflow-ui").getByLabel("Close guide").click();
    await this.page.getByLabel("Guide menu").getByText("Close guide").click();
  }

  async openNotificationsDrawer() {
    await this.page.getByTestId("notifications-button").click();
    const drawer = this.page.getByTestId("notifications-drawer");
    await drawer.click({ trial: true });
    return drawer;
  }

  async openHelpCenter() {
    await this.page.getByTestId("help-center-button").click();
  }

  async openUserMenu() {
    const button = this.page.getByTestId("user-menu");
    const menu = await openMenu(this.page, button);
    return menu;
  }

  async closeUserMenu() {
    const button = this.page.getByTestId("user-menu");
    await closeMenu(this.page, button);
  }
}
