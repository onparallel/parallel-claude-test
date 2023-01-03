import { Page } from "@playwright/test";
import { AppLayout } from "./AppLayout";

export class PetitionLayout extends AppLayout {
  constructor(page: Page) {
    super(page);
  }

  async getPetitionNameInput() {
    return await this.page.getByTestId("petition-name-input");
  }

  async goToSection(section: "COMPOSE" | "PREVIEW" | "REPLIES" | "ACTIVITY" | "MESSAGES") {
    switch (section) {
      case "COMPOSE":
        await this.page.getByTestId("petition-section-compose").click();
        break;
      case "PREVIEW":
        await this.page.getByTestId("petition-section-preview").click();
        break;
      case "REPLIES":
        await this.page.getByTestId("petition-section-replies").click();
        break;
      case "ACTIVITY":
        await this.page.getByTestId("petition-section-activity").click();
        break;
      case "MESSAGES":
        await this.page.getByTestId("petition-section-messages").click();
        break;
    }
    await this.page.waitForURL(`**/app/petitions/*/${section.toLowerCase()}*`);
  }
}
