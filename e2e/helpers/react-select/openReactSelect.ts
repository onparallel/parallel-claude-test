import { Locator, Page } from "@playwright/test";
import { getAriaControls } from "../aria/getAriaControls";

export async function openReactSelect(page: Page, locator: Locator) {
  await locator.click();
  const input = locator.locator("input");
  return await getAriaControls(page, input);
}
