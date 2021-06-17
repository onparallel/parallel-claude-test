import { Page } from "playwright";
import { goTo } from "./goTo";
import { skipOnboarding } from "./skipOnboarding";

export interface CreateContact {
  email: string;
  firstName: string;
  lastName: string;
}

export async function createContact(page: Page, contact: CreateContact) {
  await goTo(page, "/en/app/contacts");
  await skipOnboarding(page);
  await page.click("#pw-new-contact");

  await page.type("#contact-email", contact.email);
  await page.type("#contact-first-name", contact.firstName);
  await page.type("#contact-last-name", contact.lastName);
  await page.click("#create-contact-submit");
}
