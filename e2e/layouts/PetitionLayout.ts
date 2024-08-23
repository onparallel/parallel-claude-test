import { Page } from "@playwright/test";
import { isNonNullish } from "remeda";
import { openMenu } from "../helpers/chakra/openMenu";
import { fillContactSelect } from "../helpers/react-select/fillContactSelect";
import { fillRte, RteInput } from "../helpers/rte/fillRte";
import { AppLayout } from "./AppLayout";

export class PetitionLayout extends AppLayout {
  constructor(page: Page) {
    super(page);
  }

  getPetitionNameInput() {
    return this.page.getByTestId("petition-name-input");
  }

  getPetitionStatus() {
    return this.page.getByTestId("petition-status");
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

  async deletePetition() {
    const moreOptionsButton = this.page.getByTestId("petition-layout-header-menu-options");
    const menu = await openMenu(this.page, moreOptionsButton);
    await menu.getByTestId("delete-button").click();
    await this.page.getByTestId("dialog-delete-button").click();
  }

  async fillSendPetitionDialog({
    recipients,
    subject,
    body,
    reminders,
  }: {
    recipients: { email: string; firstName?: string; lastName?: string }[][];
    subject: string;
    body: RteInput;
    reminders?: {
      offset: number;
      time: string;
      weekdaysOnly: boolean;
    };
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
    await this.page.getByTestId("petition-email-subject-input").fill(subject);
    await fillRte(this.page, this.page.getByTestId("petition-email-body-rte"), body);
    if (isNonNullish(reminders)) {
      await this.page.getByTestId("enable-reminders-checkbox").setChecked(true);
      await this.page.getByTestId("reminders-config-offset-input").fill(`${reminders.offset}`);
      await this.page.getByTestId("reminders-config-time-input").fill(reminders.time);
      await this.page
        .getByTestId("reminders-config-weekdays-only-checkbox")
        .setChecked(reminders.weekdaysOnly);
    }
  }

  async submitSendPetitionDialog() {
    await this.page.getByTestId("send-button").click();
  }
}
