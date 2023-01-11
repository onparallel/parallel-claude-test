import { BrowserContext, Locator } from "@playwright/test";

export async function openTargetBlankLink(context: BrowserContext, locator: Locator) {
  const [newPage] = await Promise.all([context.waitForEvent("page"), locator.click()]);
  await newPage.waitForLoadState();
  return newPage;
}
