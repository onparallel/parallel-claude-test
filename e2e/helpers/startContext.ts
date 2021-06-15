import { Browser, BrowserContextOptions } from "playwright";

export async function startContext(
  browser: Browser,
  options?: BrowserContextOptions
) {
  return await browser.newContext({
    locale: "es-ES",
    ...(options ?? {}),
    ...(process.env.ENV_NAME === "staging"
      ? { httpCredentials: { username: "parallel", password: "cascanueces" } }
      : {}),
  });
}
