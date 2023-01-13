import { Locator, Page } from "@playwright/test";

export async function closeMenu(page: Page, locator: Locator) {
  const ariaExpanded = await locator.getAttribute("aria-expanded");
  if (ariaExpanded === "true") {
    await locator.click();
  }
}
