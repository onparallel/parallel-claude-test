import { Page } from "playwright";
import { URL } from "url";

export async function goTo(page: Page, url: string) {
  await page.goto(new URL(url, process.env.PARALLEL_URL).href);
  await page.waitForLoadState();
}
