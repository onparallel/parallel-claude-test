import { Locator, Page } from "@playwright/test";
import { escapeSelector } from "../escapeSelector";

export async function getAriaControls(page: Page, locator: Locator) {
  const controls = await locator.getAttribute("aria-controls");
  return page.locator(`#${escapeSelector(controls!)}`);
}
