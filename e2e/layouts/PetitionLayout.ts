import { Page } from "@playwright/test";
import { isDefined } from "remeda";
import { fillContactSelect } from "../helpers/react-select/fillContactSelect";
import { RteInput } from "../helpers/rte/fillRte";
import { waitForGraphQL } from "../helpers/waitForGraphQL";
import { AppLayout } from "./AppLayout";

export class PetitionLayout extends AppLayout {
  constructor(page: Page) {
    super(page);
  }

  getPetitionNameInput() {
    return this.page.getByTestId("petition-name-input");
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

  async openSendPetitionDialog() {
    await this.page.getByTestId("compose-send-petition-button").click();
  }

  async fillSendPetitionDialog({
    recipients,
    subject,
    body,
  }: {
    recipients: { email: string; firstName?: string; lastName?: string }[][];
    subject: string;
    body: RteInput;
  }) {
    let first = true;
    for (const group of recipients) {
      if (!first) {
        await this.page.getByTestId("petition-add-recipient-group-button").click();
      }
      first = false;
      const select = this.page.getByTestId("petition-recipient-select").last();
      await fillContactSelect(this.page, select, group);
    }
  }
}
