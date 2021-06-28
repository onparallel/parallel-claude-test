import { ElementHandle, Page } from "playwright";
import { ElementLike, getElement } from "./getElement";
import { toggleMenu } from "./toggleMenu";

export interface PetitionFieldData {
  title: string;
  description?: string;
  values?: string[];
}

export async function fillPetitionField(
  page: Page,
  element: ElementLike,
  data: PetitionFieldData
) {
  const el = await getElement(page, element);
  const title = await el.$(`[id^="field-title-"]`);
  await title!.fill(data.title);
  if (data.description) {
    const description = await el.$(`[id^="field-description-"]`);
    await description!.fill(data.description);
  }
  if (data.values) {
    await page.keyboard.press("ArrowDown"); // arrow down should put focus on field options
    await page.keyboard.type(data.values.join("\n"));
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
