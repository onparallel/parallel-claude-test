import { ElementHandle, Page } from "playwright";
import { getElement } from "./getElement";

export async function toggleMenu(
  page: Page,
  element: string | ElementHandle,
  isOpen = true
) {
  const button = await getElement(page, element);
  const isExpanded = (await button.getAttribute("aria-expanded")) === "true";
  const menuId = await button!.getAttribute("aria-controls");
  const menu = await page.$(`#${menuId}`);
  await menu!.waitForElementState("stable");
  console.log({ isOpen, isExpanded });
  if (isOpen && !isExpanded) {
    console.log("open menu");
    await button!.click();
    console.log("wait for menu to be visiable");
    await menu!.waitForElementState("stable");
  } else if (!isOpen && isExpanded) {
    await button!.click();
    await menu!.waitForElementState("stable");
  }
  return menu!;
}
