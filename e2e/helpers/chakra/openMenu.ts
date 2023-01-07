import { Locator, Page } from "@playwright/test";

export async function openMenu(page: Page, locator: Locator) {
  await locator.click();
  const ariaControls = await locator.getAttribute("aria-controls");
  return page.locator(`#${ariaControls}`);
}
