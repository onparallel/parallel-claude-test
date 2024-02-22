import { Page } from "@playwright/test";
import { openMenu } from "../helpers/chakra/openMenu";
import { AppLayout } from "../layouts/AppLayout";

export class PetitionsList extends AppLayout {
  constructor(page: Page) {
    super(page);
  }

  getPetitionTypeButton() {
    return this.page.getByTestId("petition-type-menu-button");
  }

  async changePetitionType(type: "PETITION" | "TEMPLATE") {
    const button = this.getPetitionTypeButton();
    const menu = await openMenu(this.page, button);
    await (
      type === "PETITION"
        ? menu.getByTestId("petition-type-petition")
        : menu.getByTestId("petition-type-template")
    ).click();
  }
}
