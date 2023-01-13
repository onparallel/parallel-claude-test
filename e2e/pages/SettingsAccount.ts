import { Page } from "@playwright/test";
import { SettingsLayout } from "../layouts/SettingsLayout";

export class SettingsAccount extends SettingsLayout {
  constructor(page: Page) {
    super(page);
  }

  async fillChangeNameForm({ firstName, lastName }: { firstName: string; lastName: string }) {
    const firstNameInput = this.page.getByTestId("first-name-input");
    await firstNameInput.fill(firstName);
    await this.page.waitForTimeout(1);
    const lastNameInput = this.page.getByTestId("last-name-input");
    await lastNameInput.fill(lastName);
  }

  async submitChangeNameForm() {
    await this.page.getByTestId("change-name-submit").click();
  }

  async changeLanguage(locale: string) {
    await this.page.locator("label", { has: this.page.locator(`input[value=${locale}]`) }).click();
  }
}
