import { Locator, Page } from "@playwright/test";

export class AppLayout {
  constructor(public page: Page) {}

  async dismissUserflow() {
    await this.page.locator("#userflow-ui").getByLabel("Close guide").click();
    await this.page.getByLabel("Guide menu").getByText("Close guide").click();
  }

  async openNotificationsDrawer() {
    await this.page.getByTestId("notifications-button").click();
    const drawer = await this.page.getByTestId("notifications-drawer");
    await drawer.click({ trial: true });
    return drawer;
  }

  async openHelpCenter() {
    await this.page.getByTestId("help-center-button").click();
  }

  async openUserMenu() {
    const button = await this.page.getByTestId("user-menu");
    const menu = await this.openMenu(button);
    return menu;
  }

  protected async openMenu(locator: Locator) {
    await locator.click();
    const controls = await locator.getAttribute("aria-controls");
    return await this.page.locator(`#${controls}`);
  }
}
