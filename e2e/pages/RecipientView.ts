import { Browser, JSHandle, Page } from "@playwright/test";
import { openEmail } from "../helpers/emails/openEmail";
import { waitForEmail, WaitForEmailOptions } from "../helpers/emails/waitForEmail";
import { selectInSimpleSelect } from "../helpers/react-select/selectInSimpleSelect";
import { waitForGraphQL } from "../helpers/waitForGraphQL";

export class RecipientView {
  constructor(private page: Page) {}

  async completeHelpDialog() {
    const button = this.page.getByTestId("help-dialog-continue-button");
    while (await button.count()) {
      await button.click();
    }
  }

  async completeVerificationCodeFlow(
    address: string,
    waitForEmailOptions: WaitForEmailOptions,
    browser: Browser
  ) {
    await this.page.getByTestId("send-verification-code-button").click();
    const email = await waitForEmail(
      this.page,
      (e) =>
        /^\d{6} is your verification code on Parallel/.test(e.subject) &&
        e.to.some((c) => c.address === address),
      waitForEmailOptions
    );
    const code = await openEmail(browser, email, async ({ page }) => {
      return (await page.getByTestId("verification-code").textContent())!;
    });
    await this.enterPinCode(code);
    await this.page.getByTestId("pin-input-verify-button").click();
    await this.page.waitForURL((url) => url.pathname.endsWith("/1"));
  }

  async replyShortTextField(index: number, reply: string) {
    const input = this.page
      .getByTestId("recipient-view-field")
      .nth(index)
      .getByTestId("recipient-view-field-short-text-new-reply-input");
    await input.fill(reply);
    await input.blur();
    await this.waithForCreateReply();
  }

  async replyTextField(index: number, reply: string) {
    const textarea = this.page
      .getByTestId("recipient-view-field")
      .nth(index)
      .getByTestId("recipient-view-field-text-new-reply-textarea");
    await textarea.fill(reply);
    await textarea.blur();
    await this.waithForCreateReply();
  }

  async replySelectField(index: number, reply: string) {
    const select = this.page
      .getByTestId("recipient-view-field")
      .nth(index)
      .getByTestId("recipient-view-field-select-new-reply-select");
    await selectInSimpleSelect(this.page, select, reply);
    await this.waithForCreateReply();
  }

  async replyCheckboxField(index: number, replies: string[]) {
    for (const reply of replies) {
      const label = this.page
        .getByTestId("recipient-view-field")
        .nth(index)
        .locator(`[data-value="${reply.replace('"', '\\"')}"]`);
      await label.click();
    }
    await this.waithForCreateReply();
  }

  async replyNumberField(index: number, reply: number) {
    const input = this.page
      .getByTestId("recipient-view-field")
      .nth(index)
      .getByTestId("recipient-view-field-number-new-reply-input");
    await input.fill(`${reply}`);
    await input.blur();
    await this.waithForCreateReply();
  }

  async replyFileUploadField(index: number, dataTransfer: JSHandle<DataTransfer>) {
    const dropzone = this.page
      .getByTestId("recipient-view-field")
      .nth(index)
      .getByTestId("recipient-view-field-file-upload-new-reply-dropzone");
    await dropzone.dispatchEvent("drop", { dataTransfer: dataTransfer });
    await waitForGraphQL(
      this.page,
      (o) => o.operationName === "RecipientViewPetitionFieldMutations_publicFileUploadReplyComplete"
    );
  }

  async finalize() {
    await this.page.getByTestId("recipient-view-finalize-button").click();
  }

  private async waithForCreateReply() {
    await waitForGraphQL(
      this.page,
      (o) => o.operationName === "RecipientViewPetitionField_publicCreatePetitionFieldReply"
    );
  }

  private async enterPinCode(code: string) {
    const input = this.page.getByTestId("pin-code-input");
    await input.click();
    await input.type(code, { delay: 50 });
  }
}
