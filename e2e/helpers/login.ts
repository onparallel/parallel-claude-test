import { Page } from "playwright";
import { goTo } from "../helpers/goTo";
import { acceptCookieConsent } from "./acceptCookieConsent";
import { User } from "./users";

export async function login(page: Page, user: User) {
  await goTo(page, "/en/login");
  await page.waitForTimeout(1000);
  await acceptCookieConsent(page);
  await page.fill("#email", user.email);
  await page.fill("#password", user.password);
  await page.click("#pw-login-submit");
  await page.waitForNavigation();
}
