import { Page } from "@playwright/test";
import { isNonNullish } from "remeda";
import { openMenu } from "../helpers/chakra/openMenu";
import { selectInSimpleSelect } from "../helpers/react-select/selectInSimpleSelect";
import { PetitionFieldType } from "../helpers/types";
import { waitForGraphQL } from "../helpers/waitForGraphQL";
import { PetitionLayout } from "../layouts/PetitionLayout";

export class PetitionCompose extends PetitionLayout {
  constructor(page: Page) {
    super(page);
  }

  async addField(type: PetitionFieldType) {
    const menu = await openMenu(this.page, this.page.getByTestId("big-add-field-button"));
    await menu.locator(`[data-field-type=${type}]`).click();
  }

  getField(index: number) {
    return this.page.getByTestId("compose-field").nth(index);
  }

  async fillFieldParams(
    index: number,
    {
      title,
      description,
      required,
      options,
    }: { title?: string; description?: string; required?: boolean; options?: string[] },
  ) {
    const field = this.getField(index);
    if (isNonNullish(title)) {
      const titleInput = field.getByTestId("compose-field-title");
      await titleInput.fill(title);
      await Promise.all([
        waitForGraphQL(this.page, (o) => o.operationName === "PetitionCompose_updatePetitionField"),
        titleInput.blur(),
      ]);
    }
    if (isNonNullish(description)) {
      const descriptionTextArea = field.getByTestId("compose-field-description");
      await descriptionTextArea.fill(description);
      await Promise.all([
        waitForGraphQL(this.page, (o) => o.operationName === "PetitionCompose_updatePetitionField"),
        descriptionTextArea.blur(),
      ]);
    }
    if (isNonNullish(required)) {
      await field.hover();
      const isChecked = await field.getByTestId("compose-field-required").isChecked();
      if (isChecked !== required) {
        await Promise.all([
          waitForGraphQL(
            this.page,
            (o) => o.operationName === "PetitionCompose_updatePetitionField",
          ),
          field.getByTestId("compose-field-required").click(),
        ]);
      }
    }
    if (isNonNullish(options)) {
      await field.getByTestId("compose-field-options").type(options.join("\n"));
      await Promise.all([
        waitForGraphQL(this.page, (o) => o.operationName === "PetitionCompose_updatePetitionField"),
        field.getByTestId("compose-field-options").blur(),
      ]);
    }
  }

  async getFieldTitle(index: number) {
    const field = this.getField(index);
    return await field.getByTestId("compose-field-title").inputValue();
  }

  async isEditParallelDialogVisible() {
    const accept = this.page.getByTestId("accept-edit-parallel-button");
    return await accept.count();
  }

  async dismissEditParallelDialog() {
    if (await this.isEditParallelDialogVisible()) {
      await this.page.getByTestId("accept-edit-parallel-button").click();
    }
  }

  async dragField(fromIndex: number, toIndex: number) {
    const field = this.getField(fromIndex);
    const handle = field.getByTestId("compose-field-drag-handle");
    const handleBox = await handle.boundingBox();
    const targetBox = await this.getField(toIndex).boundingBox();
    const fieldBox = await field.boundingBox();
    await this.page.mouse.move(
      handleBox!.x + handleBox!.width / 2,
      handleBox!.y + handleBox!.height / 2,
    );
    await this.page.mouse.down();
    await this.page.waitForTimeout(1);
    if (fromIndex > toIndex) {
      // move past the centerpoint of the next field
      await this.page.mouse.move(
        handleBox!.x + handleBox!.width / 2,
        targetBox!.y + targetBox!.height / 2 - 1,
        { steps: 10 },
      );
      await this.page.waitForTimeout(1);
      await this.page.mouse.move(
        handleBox!.x + handleBox!.width / 2,
        targetBox!.y + fieldBox!.height / 2,
        { steps: 10 },
      );
    } else {
      // move past the centerpoint of the next field
      await this.page.mouse.move(
        handleBox!.x + handleBox!.width / 2,
        targetBox!.y + targetBox!.height / 2 + 1,
        { steps: 10 },
      );
      await this.page.waitForTimeout(1);
      await this.page.mouse.move(
        handleBox!.x + handleBox!.width / 2,
        targetBox!.y + targetBox!.height - fieldBox!.height / 2,
        { steps: 10 },
      );
    }
    await this.page.waitForTimeout(1);
    await Promise.all([
      waitForGraphQL(this.page, (o) => o.operationName === "PetitionCompose_updateFieldPositions"),
      this.page.mouse.up(),
    ]);
  }

  async openFieldSettings(index: number) {
    const field = this.getField(index);
    await field.hover();
    const button = field.getByTestId("compose-field-settings-button");
    const ariaExpanded = await button.getAttribute("aria-expanded");
    if (ariaExpanded === "false") {
      await button.click();
    }
  }

  async selectShortTextFormat(value: string) {
    const select = this.page.getByTestId("petition-compose-short-text-format-select");
    await selectInSimpleSelect(this.page, select, value);
  }
}
