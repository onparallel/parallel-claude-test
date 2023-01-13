import { Locator, Page } from "@playwright/test";

export type RteInput = string;

export async function fillRte(page: Page, locator: Locator, input: RteInput) {
  const rte = locator.getByRole("textbox");
  await rte.click();
  await page.waitForTimeout(1);
  await rte.click();
  await page.waitForTimeout(1);
  await rte.type(input, { delay: 20 });
}
