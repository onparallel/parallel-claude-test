import { JSHandle, Page } from "@playwright/test";
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

  async replyShortTextField(index: number, reply: string) {
    await Promise.all([
      this.waithForCreateReply(),
      (async () => {
        const input = this.page
          .getByTestId("recipient-view-field")
          .nth(index)
          .getByTestId("recipient-view-field-short-text-new-reply-input");
        await input.fill(reply);
        await input.blur();
      })(),
    ]);
  }

  async replyTextField(index: number, reply: string) {
    await Promise.all([
      this.waithForCreateReply(),
      (async () => {
        const textarea = this.page
          .getByTestId("recipient-view-field")
          .nth(index)
          .getByTestId("recipient-view-field-text-new-reply-textarea");
        await textarea.fill(reply);
        await textarea.blur();
      })(),
    ]);
  }

  async replySelectField(index: number, reply: string) {
    await Promise.all([
      this.waithForCreateReply(),
      (async () => {
        const select = this.page
          .getByTestId("recipient-view-field")
          .nth(index)
          .getByTestId("recipient-view-field-select-new-reply-select");
        await selectInSimpleSelect(this.page, select, reply);
      })(),
    ]);
  }

  async replyCheckboxField(index: number, replies: string[]) {
    for (const reply of replies) {
      await Promise.all([
        this.waithForCreateReply(),
        (async () => {
          const label = this.page
            .getByTestId("recipient-view-field")
            .nth(index)
            .locator(`[data-value="${reply.replace('"', '\\"')}"]`);
          await label.click();
        })(),
      ]);
    }
  }

  async replyNumberField(index: number, reply: number) {
    await Promise.all([
      this.waithForCreateReply(),
      (async () => {
        const input = this.page
          .getByTestId("recipient-view-field")
          .nth(index)
          .getByTestId("recipient-view-field-number-new-reply-input");
        await input.fill(`${reply}`);
        await input.blur();
      })(),
    ]);
  }

  async replyFileUploadField(index: number, dataTransfer: JSHandle<DataTransfer>) {
    await Promise.all([
      waitForGraphQL(
        this.page,
        (o) =>
          o.operationName === "RecipientViewPetitionFieldMutations_publicFileUploadReplyComplete",
      ),
      (async () => {
        const dropzone = this.page
          .getByTestId("recipient-view-field")
          .nth(index)
          .getByTestId("recipient-view-field-file-upload-new-reply-dropzone");
        await dropzone.dispatchEvent("drop", { dataTransfer: dataTransfer });
      })(),
    ]);
  }

  async finalize() {
    await this.page.getByTestId("recipient-view-finalize-button").click();
  }

  async enterPinCode(code: string) {
    const input = this.page.getByTestId("pin-code-input");
    await input.click();
    await input.type(code, { delay: 50 });
  }

  private async waithForCreateReply() {
    await waitForGraphQL(this.page, (o) => {
      return (
        o.operationName === "RecipientViewPetitionField_publicCreatePetitionFieldReply" ||
        o.operationName === "RecipientViewPetitionField_publicUpdatePetitionFieldReply"
      );
    });
  }
}
