import { Page } from "@playwright/test";

export async function waitForRehydration(page: Page) {
  return await page.evaluate(() => {
    if ((window as any).__REHYDRATED__) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      window.addEventListener("NEXTJS_REHYDRATION_COMPLETE", () => resolve());
    });
  });
}
