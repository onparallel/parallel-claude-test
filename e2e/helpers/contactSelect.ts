import { Page } from "playwright";
import { CreateContact } from "./contacts";
import { ElementLike, getElement } from "./getElement";
import { waitForGraphQL } from "./graphql";

async function typeSearch(page: Page, element: ElementLike, search: string) {
  const el = await getElement(page, element);
  await el.type(search);
  await waitForGraphQL(
    page,
    (op) => op.operationName === "PetitionComposeSearchContacts" && op.variables?.search === search
  );
  return el;
}

export async function createContact(page: Page, element: ElementLike, contact: CreateContact) {
  await typeSearch(page, element, contact.email);
  await page.keyboard.press("Enter");
  await page.fill("#contact-first-name", contact.firstName);
  await page.fill("#contact-last-name", contact.lastName);
  await page.click("#create-contact-submit");
  await waitForGraphQL(page, (op) => op.operationName === "useCreateContact_createContact");
}
