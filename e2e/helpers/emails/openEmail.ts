import { BrowserContext, Page } from "@playwright/test";
import { Email } from "./types";

export async function openEmail<T>(
  context: BrowserContext,
  email: Email,
  body: (args: { page: Page; context: BrowserContext }) => Promise<T>
): Promise<T> {
  const page = await context.newPage();
  await page.route("http://email", (route) => {
    route.fulfill({ body: email.html as string, contentType: "text/html" });
  });
  await page.goto("http://email", { waitUntil: "domcontentloaded" });
  const result = await body({ page, context });
  await page.close();
  return result;
}
