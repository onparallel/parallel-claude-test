import { Locator, Page } from "@playwright/test";
import { isDefined } from "remeda";
import { getAriaControls } from "../aria/getAriaControls";
import { waitForSelectLoading } from "./waitForSelectLoading";

export async function fillContactSelect(
  page: Page,
  select: Locator,
  recipients: { email: string; firstName?: string | undefined; lastName?: string | undefined }[]
) {
  await select.click();
  const input = select.locator("input");
  const menu = await getAriaControls(page, input);
  for (const recipient of recipients) {
    await input.type(recipient.email);
    await waitForSelectLoading(page, select);
    const option = menu.locator(`[data-email="${recipient.email}"]`);
    if ((await option.count()) === 1) {
      await option.click();
    } else {
      const createOption = menu.getByTestId("create-contact-option");
      await page.waitForTimeout(1000);
      if ((await createOption.count()) === 1) {
        await createOption.click();
        if (!isDefined(recipient.firstName)) {
          throw new Error("Contact doesn't exist and first name was not provided.");
        }
        await page.waitForTimeout(1);
        await page.getByTestId("create-contact-first-name-input").fill(recipient.firstName);
        if (isDefined(recipient.lastName)) {
          await page.getByTestId("create-contact-last-name-input").fill(recipient.lastName);
        }
        await page.getByTestId("create-contact-button").click();
      } else {
        throw new Error("Can't find contact and can't create new contact.");
      }
    }
  }
}
