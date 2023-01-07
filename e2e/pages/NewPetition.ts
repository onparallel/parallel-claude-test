import { Page } from "@playwright/test";
import { openTab } from "../helpers/chakra/openTab";
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

  async openMyTemplates() {
    return await openTab(this.page, this.page.getByTestId("new-petition-my-templates-tab"));
  }

  async openPublicTemplates() {
    return await openTab(this.page, this.page.getByTestId("new-petition-public-templates-tab"));
  }
}
