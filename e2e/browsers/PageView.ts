import {
  Browser,
  BrowserContext,
  Page,
  BrowserType,
  ChromiumBrowser,
  FirefoxBrowser,
  WebKitBrowser,
} from "playwright";

import { launchOptions, browserContextOptions } from "./config";

type AnyBrowserType = BrowserType<
  ChromiumBrowser | FirefoxBrowser | WebKitBrowser
>;

export class PageView {
  private browser!: Browser;
  public context!: BrowserContext;
  private page!: Page;
  protected preferredBrowser: AnyBrowserType;
  private optArgs: string[] = [];

  readonly BASE_URL = `http://${
    process.env.PARALLEL_CLIENT_HOST || "localhost"
  }${
    process.env.PARALLEL_CLIENT_PORT
      ? ":" + process.env.PARALLEL_CLIENT_PORT
      : ""
  }/en`;

  constructor(preferredBrowser: AnyBrowserType, optArgs = []) {
    this.preferredBrowser = preferredBrowser;
    this.optArgs = optArgs;
  }

  async onSelector(selector: string, callback: Function) {
    try {
      const s = await this.page.waitForSelector(selector, {
        timeout: 2000,
      });
      return callback(s);
    } catch (e) {}
  }

  async clickUntilHidden(selector: string) {
    try {
      return Promise.all([
        await this.click(selector),
        await this.page.waitForSelector(selector, {
          timeout: 2000,
          state: "hidden",
        }),
      ]);
    } catch (e) {
      return await this.clickUntilHidden(selector);
    }
  }

  async load(url = "") {
    this.browser = await this.preferredBrowser.launch({
      ...launchOptions,
      args: this.optArgs,
    });
    this.context = await this.browser.newContext(browserContextOptions);
    this.page = await this.context.newPage();
    await this.page.waitForLoadState("load");
    await this.page.goto(this.BASE_URL.concat(url));
  }

  async close() {
    await this.browser.close();
  }

  async click(selector: string) {
    return await this.page.click(selector);
  }

  async clickAndNavigate(selector: string) {
    await Promise.all([
      this.page.click(selector),
      this.page.waitForNavigation(),
    ]);
  }

  async pressKey(selector: string, key: string) {
    await this.page.press(selector, key);
  }

  async title() {
    return await this.page.title();
  }

  async currentURL() {
    const url = await this.page.url();
    return url.substr(this.BASE_URL.length);
  }

  async writeInput(selector: string, value: string) {
    return await this.page.fill(selector, value);
  }

  async waitUntilVisible(selector: string, timeout = 30000) {
    return await this.page.waitForSelector(selector, {
      timeout,
      state: "visible",
    });
  }

  async query(selector: string) {
    return await this.page.$$(selector);
  }
}
