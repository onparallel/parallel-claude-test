import { Page } from "@playwright/test";
import { SettingsLayout } from "../layouts/SettingsLayout";

export class SettingsAccount extends SettingsLayout {
  constructor(page: Page) {
    super(page);
  }

  async fillChangeNameForm({ firstName, lastName }: { firstName: string; lastName: string }) {
    await this.page.getByTestId("first-name-input").fill(firstName);
    await this.page.getByTestId("last-name-input").fill(lastName);
  }

  async submitChangeNameForm() {
    await this.page.getByTestId("change-name-submit").click();
  }

  async changeLanguage(locale: string) {
    await this.page.locator("label", { has: this.page.locator(`input[value=${locale}]`) }).click();
  }
}
