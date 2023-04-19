import { Locator, Page } from "@playwright/test";
import { getAriaControls } from "../aria/getAriaControls";

export async function openTab(page: Page, locator: Locator) {
  const ariaSelected = await locator.getAttribute("aria-selected");
  if (ariaSelected !== "true") {
    locator.click();
  }
  return await getAriaControls(page, locator);
}
