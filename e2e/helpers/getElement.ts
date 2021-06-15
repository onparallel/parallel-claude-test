import { ElementHandle, Page } from "playwright";

export async function getElement(page: Page, element: string | ElementHandle) {
  if (typeof element === "string") {
    return (await page.$(element))!;
  } else {
    return element;
  }
}
