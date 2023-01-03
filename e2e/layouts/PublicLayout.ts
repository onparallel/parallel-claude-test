import { Page } from "@playwright/test";

export class PublicLayout {
  constructor(public page: Page) {}

  async dismissCookieBanner() {
    const dismiss = this.page.getByTestId("cookie-consent").getByTitle("Close");
    await dismiss.waitFor();
    await dismiss.click();
  }
}
