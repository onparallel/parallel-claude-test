import { Locator, Page } from "@playwright/test";

export async function openTab(page: Page, locator: Locator) {
  const ariaSelected = await locator.getAttribute("aria-selected");
  if (ariaSelected !== "true") {
    locator.click();
  }
  const controls = await locator.getAttribute("aria-controls");
  return page.locator(`#${controls}`);
}
