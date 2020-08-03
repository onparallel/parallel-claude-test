import { LaunchOptions, BrowserContextOptions } from "playwright";

const launchOptions: LaunchOptions = {
  headless: !!process.env.PLAYWRIGHT_HEADLESS,
  timeout: 60000,
  slowMo: process.env.PLAYWRIGHT_HEADLESS ? 0 : 50,
};

const browserContextOptions: BrowserContextOptions = {
  locale: "en-US",
};

export { launchOptions, browserContextOptions };
