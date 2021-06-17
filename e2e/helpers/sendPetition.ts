import { Page } from "playwright";
import { getRandomRecipientData } from "./emails";

export async function sendPetition(page: Page) {
  const recipient = getRandomRecipientData();
  await page.click("#petition-next");

  const recipientsEmailInput = await page.$("#petition-recipients-0");
  await recipientsEmailInput?.type(recipient.email);

  await page.waitForTimeout(1000);

  await page.keyboard.press("Enter");

  const firstNameInput = await page.$("#contact-first-name");
  await firstNameInput?.type(recipient.firstName);

  const lastNameInput = await page.$("#contact-last-name");
  await lastNameInput?.type(recipient.lastName);

  const createContactSubmitButton = await page.$("#create-contact-submit");
  await createContactSubmitButton?.click();
  await page.waitForTimeout(1000);

  const messageEmailEditorSubject = await page.$(
    "#input-message-email-editor-subject"
  );
  await messageEmailEditorSubject?.type(
    `KYC - ${recipient.firstName} ${recipient.lastName}`
  );

  const messageEmailEditorBody = await page.$("#rich-text-editor-textarea");
  await messageEmailEditorBody?.type(
    "Please, fill this information about yourself.\nKind Regards."
  );

  const sendPetitionButton = await page.$("#send-button");
  await sendPetitionButton?.click();
  await page.waitForNavigation();

  return recipient;
}
