import { Locator, Page } from "@playwright/test";
import { getAriaControls } from "../aria/getAriaControls";

export async function openMenu(page: Page, locator: Locator) {
  const ariaExpanded = await locator.getAttribute("aria-expanded");
  const menu = await getAriaControls(page, locator);
  if (ariaExpanded === "false") {
    await Promise.all([menu.waitFor({ state: "visible" }), locator.click()]);
  }
  return menu;
}
