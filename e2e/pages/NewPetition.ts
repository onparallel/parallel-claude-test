import { Page } from "@playwright/test";
import { isDefined } from "remeda";
import { openMenu } from "../helpers/chakra/openMenu";
import { openTab } from "../helpers/chakra/openTab";
import { fillUserSelect, UserOrGroup } from "../helpers/react-select/fillUserSelect";
import { AppLayout } from "../layouts/AppLayout";

export class NewPetition extends AppLayout {
  constructor(page: Page) {
    super(page);
  }

  async openTemplateModal(templateId: string) {
    await this.page.locator(`[data-template-id="${templateId}"]`).click();
  }

  async createPetition(templateId: string) {
    await this.openTemplateModal(templateId);
    await this.page.getByTestId("create-parallel-button").click();
  }

  async duplicateTemplate(templateId: string) {
    await this.ensureTemplateModalIsOpen(templateId);
    const moreOptionsButton = this.page.getByTestId("template-more-options-button");
    const menu = await openMenu(this.page, moreOptionsButton);
    await menu.getByTestId("duplicate-template-button").click();
  }

  async shareTemplate(templateId: string, usersOrGroups: UserOrGroup[], message?: string) {
    await this.ensureTemplateModalIsOpen(templateId);
    const moreOptionsButton = this.page.getByTestId("template-more-options-button");
    const menu = await openMenu(this.page, moreOptionsButton);
    await menu.getByTestId("share-template-button").click();
    const select = this.page.getByTestId("share-petition-select");
    await fillUserSelect(this.page, select, usersOrGroups);
    const checkbox = this.page.getByTestId("notify-users-checkbox");
    await checkbox.setChecked(true);
    if (isDefined(message)) {
      await this.page.getByTestId("notify-users-message").fill(message);
    }
    await this.page.getByTestId("share-petition-send-button").click();
  }

  async editTemplate(templateId: string) {
    await this.ensureTemplateModalIsOpen(templateId);
    const moreOptionsButton = this.page.getByTestId("template-more-options-button");
    const menu = await openMenu(this.page, moreOptionsButton);
    await menu.getByTestId("edit-template-button").click();
  }

  async openMyTemplates() {
    return await openTab(this.page, this.page.getByTestId("new-petition-my-templates-tab"));
  }

  async openPublicTemplates() {
    return await openTab(this.page, this.page.getByTestId("new-petition-public-templates-tab"));
  }

  private async ensureTemplateModalIsOpen(templateId: string) {
    const modal = this.page.locator(`[role="dialog"][data-template-id="${templateId}"]`);
    await modal.waitFor();
    if ((await modal.count()) !== 1) {
      throw new Error("Template modal not open");
    }
  }
}
