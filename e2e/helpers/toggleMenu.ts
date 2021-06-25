import { Page } from "playwright";
import { ElementLike, getElement } from "./getElement";

export async function toggleMenu(
  page: Page,
  element: ElementLike,
  isOpen = true
) {
  const button = await getElement(page, element);
  const isExpanded = (await button.getAttribute("aria-expanded")) === "true";
  const menuId = await button!.getAttribute("aria-controls");
  const menu = await page.$(`#${menuId}`);
  await menu!.waitForElementState("stable");
  if (isOpen && !isExpanded) {
    await button!.click();
    await menu!.waitForElementState("stable");
  } else if (!isOpen && isExpanded) {
    await button!.click();
    await menu!.waitForElementState("stable");
  }
  return menu!;
}
