import { Browser } from "@playwright/test";
import { Email } from "./types";

export async function openEmail(browser: Browser, email: Email) {
  const c = await browser.newContext({});
  const p = await c.newPage();
  await p.route("http://email", (route) => {
    route.fulfill({ body: email.html as string });
  });
  await p.goto("http://email", { waitUntil: "domcontentloaded" });
  return p;
}
