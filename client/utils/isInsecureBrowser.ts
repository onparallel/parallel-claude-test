import { UAParser } from "ua-parser-js";
import compareVersions from "compare-versions";

export function isInsecureBrowser(userAgent: string | undefined) {
  if (userAgent === undefined) {
    return false;
  }
  const ua = new UAParser(userAgent);
  const browser = ua.getBrowser();
  const insecure: Record<string, string> = {
    IE: "999",
    Edge: "89",
    Safari: "13.3",
    Firefox: "60.5",
  };
  if (
    browser.name &&
    browser.name in insecure &&
    browser.version &&
    compareVersions(browser.version, insecure[browser.name]) < 0
  ) {
    return true;
  }
}
