import { ElementHandle, Page } from "playwright";

export type ElementLike = string | ElementHandle;

export async function getElement(page: Page, element: ElementLike) {
  if (typeof element === "string") {
    return (await page.$(element))!;
  } else {
    return element;
  }
}
