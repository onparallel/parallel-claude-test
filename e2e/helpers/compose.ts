import { ElementHandle, Page } from "playwright";
import { toggleMenu } from "./toggleMenu";

export interface PetitionFieldData {
  title: string;
  description?: string;
  values?: string[];
}

export async function fillPetitionField(
  element: ElementHandle,
  data: PetitionFieldData
) {
  const title = await element.$(`[id^="field-title-"]`);
  await title!.type(data.title);
  if (data.description) {
    const description = await element.$(`[id^="field-description-"]`);
    await description!.type(data.description);
  }
  if (data.values) {
    const values = await element.$(`[id^="field-select-values-"]`);
    await values!.type(data.values.join("\n"));
  }
}

export type PetitionFieldType =
  | "DYNAMIC_SELECT"
  | "FILE_UPLOAD"
  | "HEADING"
  | "SELECT"
  | "SHORT_TEXT"
  | "TEXT";

export async function addPetitionField(page: Page, type: PetitionFieldType) {
  const fields = await page.$$("#petition-fields > *");
  const menu = await toggleMenu(page, "#menu-button-big-add-field-button");
  const create = await menu.waitForSelector(`[data-field-type="${type}"]`);
  await create.scrollIntoViewIfNeeded();
  await create!.click();
  await page.click("body"); // sometimes the menu remains open
  await page.waitForSelector(
    `#petition-fields > *:nth-child(${fields.length + 2})`
  );
}

export async function getFields(page: Page): Promise<ElementHandle[]> {
  return await page.$$("#petition-fields > *:not(.add-field-button-wrapper)");
}
