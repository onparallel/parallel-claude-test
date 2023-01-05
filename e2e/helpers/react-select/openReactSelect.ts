import { Locator, Page } from "@playwright/test";

export async function openReactSelect(page: Page, locator: Locator) {
  await locator.click();
  const input = locator.locator("input");
  const controls = await input.getAttribute("aria-controls");
  return page.locator(`#${controls}`);
}
