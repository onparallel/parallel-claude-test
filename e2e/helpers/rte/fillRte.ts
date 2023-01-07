import { Locator, Page } from "@playwright/test";

export type RteInput = string;

export async function fillRte(page: Page, locator: Locator, input: RteInput) {
  await locator.getByRole("textbox").click();
  await page.keyboard.type(input);
}
