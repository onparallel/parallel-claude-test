import { Locator, Page } from "@playwright/test";

export async function openMenu(page: Page, locator: Locator) {
  const ariaControls = await locator.getAttribute("aria-controls");
  const ariaExpanded = await locator.getAttribute("aria-expanded");
  const menu = page.locator(`#${ariaControls}`);
  if (ariaExpanded === "false") {
    await Promise.all([menu.waitFor({ state: "visible" }), locator.click()]);
  }
  return menu;
}
