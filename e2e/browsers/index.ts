import { PageView } from "./PageView";
import { chromium, firefox, webkit } from "playwright";

const { PLAYWRIGHT_BROWSERS: BROWSERS = "chrome,webkit,firefox" } = process.env;

export const browsers: { [key: string]: PageView } = {
  Chrome: BROWSERS.includes("chrome")
    ? new PageView(chromium, ["--no-sandbox"])
    : undefined,
  Firefox: BROWSERS.includes("firefox") ? new PageView(firefox) : undefined,
  Webkit: BROWSERS.includes("webkit") ? new PageView(webkit) : undefined,
};
