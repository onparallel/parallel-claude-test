import { Page } from "@playwright/test";
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
}
