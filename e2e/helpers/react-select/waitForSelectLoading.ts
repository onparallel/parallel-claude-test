import { Locator, Page } from "@playwright/test";

export async function waitForSelectLoading(page: Page, locator: Locator) {
  await page.waitForFunction(
    (element) => {
      return element?.getAttribute("data-loading") === null;
    },
    await locator.elementHandle(),
  );
}
