import { Page } from "playwright";

export async function skipOnboarding(page: Page) {
  const dialog = await page.$("#pw-onboarding-dialog");
  if (dialog) {
    const skip = await dialog.$(`[data-action="skip"]`);
    await skip?.click();
  }
}
