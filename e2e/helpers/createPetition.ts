import { Page } from "playwright";
import { toggleMenu } from "./toggleMenu";

export async function createPetition(page: Page) {
  const menu = await toggleMenu(page, "#menu-button-create-petition");
  const button = await menu.$("button");
  await button!.click();
  await page.waitForNavigation();
}
