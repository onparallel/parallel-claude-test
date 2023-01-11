import { Locator, Page } from "@playwright/test";
import { openReactSelect } from "./openReactSelect";

export async function selectInSimpleSelect(page: Page, locator: Locator, value: string) {
  const menuList = await openReactSelect(page, locator);
  const option = menuList.locator(`[data-value="${value.replace('"', '\\"')}"]`);
  await option.scrollIntoViewIfNeeded();
  await option.click();
}
