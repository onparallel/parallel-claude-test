import { Browser, chromium, firefox, LaunchOptions, webkit } from "playwright";

export const getBrowser = (() => {
  const cache: Record<string, Browser> = {};
  return async function getBrowser(browserName: string, headless = false) {
    const options: LaunchOptions = {
      headless,
      timeout: 60 * 1000,
      slowMo: 0,
    };
    return (
      cache[browserName] ??
      (cache[browserName] = await (async () => {
        switch (browserName) {
          case "firefox":
            return await firefox.launch(options);
          case "webkit":
            return await webkit.launch(options);
          case "chrome":
          default:
            return await chromium.launch({
              ...options,
              args: ["--no-sandbox"],
            });
        }
      })())
    );
  };
})();
