import { Page } from "@playwright/test";
import { AppLayout } from "../layouts/AppLayout";

export class PetitionsList extends AppLayout {
  constructor(page: Page) {
    super(page);
  }

  async changePetitionType(type: "PETITION" | "TEMPLATE") {
    const button = await this.page.getByTestId("petition-type-menu");
    const menu = await this.openMenu(button);
    await (type === "PETITION"
      ? menu.getByTestId("petition-type-petition")
      : menu.getByTestId("petition-type-template")
    ).click();
    await this.page.waitForLoadState("networkidle");
  }
}
