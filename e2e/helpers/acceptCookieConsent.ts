import { Page } from "playwright";

export async function acceptCookieConsent(page: Page) {
  try {
    await page.click("#cookie-content-accept");
  } catch {}
}
